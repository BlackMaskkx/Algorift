#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>
#include <pybind11/stl.h>
#include <immintrin.h>  // AVX2 intrinsics
#include <thread>
#include <mutex>

namespace py = pybind11;

// =====================
// 1. OPTIMIZED MATH (SIMD)
// =====================

// Vectorized array sum (AVX2)
py::array_t<double> simd_sum(py::array_t<double> input) {
    py::buffer_info buf = input.request();
    double* ptr = static_cast<double*>(buf.ptr);
    size_t size = buf.size;

    // AVX2-accelerated sum
    __m256d sum_vec = _mm256_setzero_pd();
    for (size_t i = 0; i < size / 4 * 4; i += 4) {
        __m256d data = _mm256_loadu_pd(ptr + i);
        sum_vec = _mm256_add_pd(sum_vec, data);
    }

    // Horizontal sum
    double sum_array[4];
    _mm256_storeu_pd(sum_array, sum_vec);
    double total = sum_array[0] + sum_array[1] + sum_array[2] + sum_array[3];

    // Remainder (non-vectorized)
    for (size_t i = size / 4 * 4; i < size; i++) {
        total += ptr[i];
    }

    return py::cast(total);
}

// =====================
// 2. GIL-FREE MULTITHREADING
// =====================

// Thread-safe counter (bypassing GIL)
class GilFreeCounter {
public:
    GilFreeCounter() : count(0) {}

    void increment() {
        std::lock_guard<std::mutex> lock(mutex);
        count++;
    }

    int get() const { return count; }

private:
    mutable std::mutex mutex;
    int count;
};

// =====================
// 3. DIRECT MEMORY MANIPULATION
// =====================

// Custom memory allocator (Python-compatible)
py::bytes allocate_raw_memory(size_t size) {
    char* buffer = new char[size];
    return py::bytes(buffer, size);
}

// =====================
// 4. PYTHON-C++ BRIDGE (PyBind11)
// =====================

PYBIND11_MODULE(core_cpp, m) {
    m.def("simd_sum", &simd_sum, "Sum array with AVX2");
    
    py::class_<GilFreeCounter>(m, "GilFreeCounter")
        .def(py::init<>())
        .def("increment", &GilFreeCounter::increment)
        .def("get", &GilFreeCounter::get);
        
    m.def("allocate_raw_memory", &allocate_raw_memory);
}

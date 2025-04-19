import numpy as np
from core_cpp import simd_sum, GilFreeCounter, allocate_raw_memory
from threading import Thread
import time

# =====================
# 1. SIMD OPTIMIZATION (C++ AVX2)
# =====================
def benchmark_simd():
    data = np.random.rand(10_000_000)
    
    start = time.time()
    py_sum = sum(data)  # Pure Python (slow)
    py_time = time.time() - start
    
    start = time.time()
    cpp_sum = simd_sum(data)  # C++ AVX2
    cpp_time = time.time() - start
    
    print(f"Python sum: {py_sum:.4f} ({py_time:.4f}s)")
    print(f"C++ SIMD sum: {cpp_sum:.4f} ({cpp_time:.4f}s)")

# =====================
# 2. GIL-FREE MULTITHREADING
# =====================
def test_gil_free_counter():
    counter = GilFreeCounter()
    threads = []
    
    def worker():
        for _ in range(1_000_000):
            counter.increment()
    
    for _ in range(4):
        t = Thread(target=worker)
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    
    print(f"Final count (GIL-free): {counter.get()}")

# =====================
# 3. RAW MEMORY MANAGEMENT
# =====================
def test_raw_memory():
    raw_data = allocate_raw_memory(1024)  # Allocates 1KB in C++
    print(f"Raw memory: {len(raw_data)} bytes")

if __name__ == "__main__":
    print("=== PYTHON + C++ MASTER CODE ===")
    benchmark_simd()
    test_gil_free_counter()
    test_raw_memory()

#![feature(asm)] // For inline assembly (nightly Rust)

use std::{
    alloc::{alloc, dealloc, Layout},
    cell::UnsafeCell,
    mem::ManuallyDrop,
    ptr::{self, NonNull},
    sync::{
        atomic::{AtomicPtr, Ordering},
        Arc,
    },
    thread,
};
use libc::c_int; // For FFI

// =====================
// 1. UNSAFE RUST (RAW POINTERS)
// =====================

/// A custom vector that manually manages memory (like C++)
struct UnsafeVector<T> {
    ptr: NonNull<T>,
    cap: usize,
    len: usize,
}

impl<T> UnsafeVector<T> {
    pub fn new() -> Self {
        Self {
            ptr: NonNull::dangling(),
            cap: 0,
            len: 0,
        }
    }

    pub fn push(&mut self, item: T) {
        if self.len == self.cap {
            self.grow();
        }

        unsafe {
            // SAFETY: We checked capacity, and ptr is valid
            ptr::write(self.ptr.as_ptr().add(self.len), item);
        }
        self.len += 1;
    }

    fn grow(&mut self) {
        let new_cap = if self.cap == 0 { 1 } else { self.cap * 2 };
        let new_layout = Layout::array::<T>(new_cap).unwrap();

        let new_ptr = if self.cap == 0 {
            unsafe { alloc(new_layout) }
        } else {
            let old_layout = Layout::array::<T>(self.cap).unwrap();
            let old_ptr = self.ptr.as_ptr() as *mut u8;
            unsafe { std::alloc::realloc(old_ptr, old_layout, new_layout.size()) }
        };

        self.ptr = match NonNull::new(new_ptr as *mut T) {
            Some(p) => p,
            None => std::alloc::handle_alloc_error(new_layout),
        };
        self.cap = new_cap;
    }
}

impl<T> Drop for UnsafeVector<T> {
    fn drop(&mut self) {
        if self.cap != 0 {
            unsafe {
                // Drop all elements
                for i in 0..self.len {
                    ptr::drop_in_place(self.ptr.as_ptr().add(i));
                }
                // Free memory
                dealloc(
                    self.ptr.as_ptr() as *mut u8,
                    Layout::array::<T>(self.cap).unwrap(),
                );
            }
        }
    }
}

// =====================
// 2. LOCK-FREE CONCURRENCY
// =====================

/// A lock-free stack (atomic pointers + unsafe)
struct LockFreeStack<T> {
    head: AtomicPtr<Node<T>>,
}

struct Node<T> {
    data: ManuallyDrop<T>,
    next: *mut Node<T>,
}

impl<T> LockFreeStack<T> {
    pub fn new() -> Self {
        Self {
            head: AtomicPtr::new(ptr::null_mut()),
        }
    }

    pub fn push(&self, data: T) {
        let node = Box::into_raw(Box::new(Node {
            data: ManuallyDrop::new(data),
            next: ptr::null_mut(),
        }));

        loop {
            let head = self.head.load(Ordering::Relaxed);
            unsafe { (*node).next = head };

            if self
                .head
                .compare_exchange_weak(head, node, Ordering::Release, Ordering::Relaxed)
                .is_ok()
            {
                break;
            }
        }
    }

    pub fn pop(&self) -> Option<T> {
        loop {
            let head = self.head.load(Ordering::Acquire);
            if head.is_null() {
                return None;
            }

            let next = unsafe { (*head).next };

            if self
                .head
                .compare_exchange_weak(head, next, Ordering::Release, Ordering::Relaxed)
                .is_ok()
            {
                unsafe {
                    let data = ManuallyDrop::take(&mut (*head).data);
                    let _ = Box::from_raw(head); // Free memory
                    return Some(data);
                }
            }
        }
    }
}

// =====================
// 3. ADVANCED MACROS
// =====================

/// A macro that generates optimized match arms (compile-time)
macro_rules! optimized_match {
    ($value:expr, { $($pattern:pat => $result:expr),+ }) => {
        match $value {
            $( $pattern => $result, )+
        }
    };
}

/// A custom `println!` that logs to a file (procedural macro would be better)
macro_rules! log {
    ($($arg:tt)*) => {{
        use std::fs::OpenOptions;
        use std::io::Write;
        let mut file = OpenOptions::new()
            .append(true)
            .create(true)
            .open("rust_master.log")
            .unwrap();
        writeln!(file, $($arg)*).unwrap();
    }};
}

// =====================
// 4. FFI (C INTEROP)
// =====================

extern "C" {
    fn rand() -> c_int;
}

/// Call C's `rand()` from Rust
pub fn c_rand() -> i32 {
    unsafe { rand() }
}

// =====================
// 5. MAIN FUNCTION
// =====================

fn main() {
    // 1. Unsafe Vector
    let mut vec = UnsafeVector::new();
    vec.push(42);
    vec.push(1337);
    log!("UnsafeVector len: {}", vec.len);

    // 2. Lock-Free Stack
    let stack = Arc::new(LockFreeStack::new());
    let handles: Vec<_> = (0..4)
        .map(|i| {
            let stack = stack.clone();
            thread::spawn(move || {
                stack.push(i);
                log!("Thread {} pushed {}", i, i);
            })
        })
        .collect();

    for handle in handles {
        handle.join().unwrap();
    }

    while let Some(val) = stack.pop() {
        log!("Popped: {}", val);
    }

    // 3. Advanced Macro
    let x = 42;
    optimized_match!(x, {
        0 => log!("Zero"),
        42 => log!("The Answer"),
        _ => log!("Other")
    });

    // 4. FFI
    log!("C rand(): {}", c_rand());

    // 5. Inline Assembly (Nightly Rust)
    unsafe {
        let mut value: u64 = 10;
        asm!(
            "mov {0}, {0}",
            "add {0}, 5",
            inout(reg) value,
        );
        log!("Inline ASM result: {}", value);
    }
          }

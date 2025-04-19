package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"reflect"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

// =====================
// 1. LANGUAGE BASICS
// =====================

// Basic types and variables
func demonstrateBasicTypes() {
	// Integer types
	var intVar int = 42
	intVar2 := 42 // Type inference

	// Floating point
	floatVar := 3.14 // float64 by default
	var float32Var float32 = 3.14

	// Boolean
	boolVar := true

	// String
	stringVar := "Hello, Go!"

	// Complex numbers
	complexVar := complex(1, 2) // 1+2i

	fmt.Printf("Basic types: %d, %d, %f, %f, %t, %s, %v\n",
		intVar, intVar2, floatVar, float32Var, boolVar, stringVar, complexVar)
}

// =====================
// 2. FUNCTIONS AND METHODS
// =====================

// Basic function
func add(a, b int) int {
	return a + b
}

// Multiple return values
func divide(a, b float64) (float64, error) {
	if b == 0.0 {
		return 0.0, errors.New("division by zero")
	}
	return a / b, nil
}

// Variadic function
func sum(numbers ...int) int {
	total := 0
	for _, num := range numbers {
		total += num
	}
	return total
}

// Method example
type Rectangle struct {
	Width, Height float64
}

func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// =====================
// 3. CONCURRENCY
// =====================

// Goroutine example
func demonstrateGoroutines() {
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			time.Sleep(100 * time.Millisecond)
			fmt.Printf("Goroutine %d completed\n", id)
		}(i)
	}

	wg.Wait()
	fmt.Println("All goroutines finished")
}

// Channel example
func demonstrateChannels() {
	messageChan := make(chan string, 2)

	go func() {
		messageChan <- "Hello"
		messageChan <- "World"
		close(messageChan)
	}()

	for msg := range messageChan {
		fmt.Println(msg)
	}
}

// Worker pool pattern
func workerPoolExample() {
	const numJobs = 10
	const numWorkers = 3

	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	// Start workers
	for w := 1; w <= numWorkers; w++ {
		go func(id int) {
			for job := range jobs {
				fmt.Printf("Worker %d processing job %d\n", id, job)
				time.Sleep(500 * time.Millisecond)
				results <- job * 2
			}
		}(w)
	}

	// Send jobs
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	// Collect results
	for r := 1; r <= numJobs; r++ {
		fmt.Printf("Result: %d\n", <-results)
	}
}

// =====================
// 4. ERROR HANDLING
// =====================

// Custom error type
type CustomError struct {
	Code    int
	Message string
}

func (e *CustomError) Error() string {
	return fmt.Sprintf("Error %d: %s", e.Code, e.Message)
}

func processInput(value int) error {
	if value < 0 {
		return &CustomError{
			Code:    400,
			Message: "negative value not allowed",
		}
	}
	return nil
}

// =====================
// 5. INTERFACES
// =====================

// Basic interface
type Shape interface {
	Area() float64
	Perimeter() float64
}

// Implementing interface
type Circle struct {
	Radius float64
}

func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

func printShapeInfo(s Shape) {
	fmt.Printf("Area: %.2f, Perimeter: %.2f\n", s.Area(), s.Perimeter())
}

// =====================
// 6. HTTP SERVER
// =====================

func startHTTPServer() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Welcome to the Go HTTP server!")
	})

	http.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
		data := map[string]interface{}{
			"timestamp": time.Now().Unix(),
			"message":   "Hello from Go server",
		}
		json.NewEncoder(w).Encode(data)
	})

	fmt.Println("Server starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// =====================
// 7. TESTING (would normally be in _test.go files)
// =====================

// Function to test
func multiply(a, b int) int {
	return a * b
}

// Example test (this would be in multiply_test.go)
/*
func TestMultiply(t *testing.T) {
	testCases := []struct {
		a, b, expected int
	}{
		{2, 3, 6},
		{0, 5, 0},
		{-2, 4, -8},
	}

	for _, tc := range testCases {
		result := multiply(tc.a, tc.b)
		if result != tc.expected {
			t.Errorf("multiply(%d, %d) = %d; want %d", tc.a, tc.b, result, tc.expected)
		}
	}
}
*/

// =====================
// 8. UTILITIES
// =====================

// JSON processing
func processJSON() {
	type Person struct {
		Name string `json:"name"`
		Age  int    `json:"age"`
	}

	// Marshal
	p := Person{"Alice", 30}
	jsonData, _ := json.Marshal(p)
	fmt.Println(string(jsonData))

	// Unmarshal
	var p2 Person
	json.Unmarshal(jsonData, &p2)
	fmt.Printf("Unmarshaled: %+v\n", p2)
}

// File operations
func fileOperations() {
	// Writing
	content := []byte("Hello, Go!")
	err := os.WriteFile("example.txt", content, 0644)
	if err != nil {
		log.Fatal(err)
	}

	// Reading
	readContent, err := os.ReadFile("example.txt")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("File content:", string(readContent))
}

// =====================
// MAIN FUNCTION
// =====================

func main() {
	fmt.Println("=== Ultimate Go Reference ===")
	
	demonstrateBasicTypes()
	
	// Function examples
	fmt.Println("Add:", add(5, 3))
	result, err := divide(10, 2)
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Println("Divide:", result)
	}
	fmt.Println("Sum:", sum(1, 2, 3, 4, 5))
	
	// Method example
	rect := Rectangle{10, 5}
	fmt.Println("Rectangle area:", rect.Area())
	
	// Concurrency
	demonstrateGoroutines()
	demonstrateChannels()
	workerPoolExample()
	
	// Error handling
	if err := processInput(-5); err != nil {
		fmt.Println("Custom error:", err)
	}
	
	// Interfaces
	circle := Circle{10}
	printShapeInfo(circle)
	
	// JSON
	processJSON()
	
	// File operations
	fileOperations()
	
	// Uncomment to start HTTP server
	// go startHTTPServer()
	// time.Sleep(1 * time.Second) // Give server time to start
	
	fmt.Println("=== End of demonstrations ===")
}

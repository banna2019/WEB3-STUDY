package main

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

// AtomicCounter 原子计数器结构体
type AtomicCounter struct {
	value int64
}

// Increment 使用原子操作递增计数器
func (c *AtomicCounter) Increment() {
	atomic.AddInt64(&c.value, 1)
}

// GetValue 使用原子操作获取计数器值
func (c *AtomicCounter) GetValue() int64 {
	return atomic.LoadInt64(&c.value)
}

// AtomicWorker 原子操作工作协程函数
func AtomicWorker(counter *AtomicCounter, workerID int, iterations int, wg *sync.WaitGroup) {
	defer wg.Done()

	fmt.Printf("原子工作协程 %d 开始执行，将进行 %d 次递增操作\n", workerID, iterations)

	for i := 0; i < iterations; i++ {
		counter.Increment()

		// 每100次操作输出一次进度
		if (i+1)%100 == 0 {
			fmt.Printf("原子工作协程 %d 已完成 %d 次操作\n", workerID, i+1)
		}
	}

	fmt.Printf("原子工作协程 %d 完成所有操作\n", workerID)
}

func main() {
	fmt.Println("=== Go语言原子操作(Atomic)无锁计数器示例 ===")
	fmt.Println()

	// 创建原子计数器
	counter := &AtomicCounter{value: 0}

	// 创建WaitGroup用于同步协程
	var wg sync.WaitGroup

	// 记录开始时间
	startTime := time.Now()

	// 启动10个工作协程
	numWorkers := 10
	iterationsPerWorker := 1000

	fmt.Printf("启动 %d 个原子工作协程，每个协程将进行 %d 次递增操作\n", numWorkers, iterationsPerWorker)
	fmt.Printf("预期最终结果: %d\n", numWorkers*iterationsPerWorker)
	fmt.Println()

	for i := 1; i <= numWorkers; i++ {
		wg.Add(1)
		go AtomicWorker(counter, i, iterationsPerWorker, &wg)
	}

	// 等待所有协程完成
	wg.Wait()

	// 记录结束时间
	endTime := time.Now()
	duration := endTime.Sub(startTime)

	// 输出最终结果
	fmt.Println()
	fmt.Println("=== 原子操作执行结果 ===")
	fmt.Printf("最终计数器值: %d\n", counter.GetValue())
	fmt.Printf("预期值: %d\n", numWorkers*iterationsPerWorker)
	fmt.Printf("执行时间: %v\n", duration)

	// 验证结果是否正确
	if counter.GetValue() == int64(numWorkers*iterationsPerWorker) {
		fmt.Println("✓ 结果正确！原子操作成功保护了共享资源")
	} else {
		fmt.Println("× 结果错误！可能存在竞态条件")
	}

	// 对比不同同步方式的性能
	fmt.Println("\n=== 性能对比：原子操作 vs 互斥锁 ===")
	comparePerformance()

	// 演示其他原子操作
	fmt.Println("\n=== 其他原子操作演示 ===")
	demonstrateOtherAtomicOperations()
}

// comparePerformance 对比原子操作和互斥锁的性能
func comparePerformance() {
	iterations := 10000
	numWorkers := 10

	// 测试原子操作性能
	atomicCounter := &AtomicCounter{value: 0}
	var atomicWg sync.WaitGroup

	atomicStart := time.Now()
	for i := 0; i < numWorkers; i++ {
		atomicWg.Add(1)
		go func() {
			defer atomicWg.Done()
			for j := 0; j < iterations; j++ {
				atomicCounter.Increment()
			}
		}()
	}
	atomicWg.Wait()
	atomicDuration := time.Since(atomicStart)

	// 测试互斥锁性能
	mutexCounter := struct {
		value int64
		mutex sync.Mutex
	}{}
	var mutexWg sync.WaitGroup

	mutexStart := time.Now()
	for i := 0; i < numWorkers; i++ {
		mutexWg.Add(1)
		go func() {
			defer mutexWg.Done()
			for j := 0; j < iterations; j++ {
				mutexCounter.mutex.Lock()
				mutexCounter.value++
				mutexCounter.mutex.Unlock()
			}
		}()
	}
	mutexWg.Wait()
	mutexDuration := time.Since(mutexStart)

	fmt.Printf("原子操作执行时间: %v\n", atomicDuration)
	fmt.Printf("互斥锁执行时间: %v\n", mutexDuration)
	fmt.Printf("原子操作比互斥锁快: %.2fx\n", float64(mutexDuration)/float64(atomicDuration))
}

// demonstrateOtherAtomicOperations 演示其他原子操作
func demonstrateOtherAtomicOperations() {
	var value int64

	fmt.Println("1. 原子加法操作:")
	atomic.AddInt64(&value, 5)
	fmt.Printf("AddInt64(&value, 5) = %d\n", atomic.LoadInt64(&value))

	fmt.Println("2. 原子减法操作:")
	atomic.AddInt64(&value, -3)
	fmt.Printf("AddInt64(&value, -3) = %d\n", atomic.LoadInt64(&value))

	fmt.Println("3. 原子比较并交换操作:")
	oldValue := atomic.LoadInt64(&value)
	newValue := atomic.CompareAndSwapInt64(&value, oldValue, 100)
	fmt.Printf("CompareAndSwapInt64: 旧值=%d, 成功=%t, 当前值=%d\n", oldValue, newValue, atomic.LoadInt64(&value))

	fmt.Println("4. 原子交换操作:")
	oldValue = atomic.SwapInt64(&value, 200)
	fmt.Printf("SwapInt64: 旧值=%d, 当前值=%d\n", oldValue, atomic.LoadInt64(&value))

	fmt.Println("5. 原子存储操作:")
	atomic.StoreInt64(&value, 999)
	fmt.Printf("StoreInt64(&value, 999) = %d\n", atomic.LoadInt64(&value))
}

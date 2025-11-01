## 一、指针

- 题目: 编写一个`Go`程序,定义一个函数,该函数接收一个整数指针作为参数,在函数内部将该指针指向的值增加10,然后在主函数中调用该函数并输出修改后的值.
  - 考差点: 指针的使用、值传递与引用传递的区别.

### 示例1

```go
package main

import "fmt"

// addPtr 函数接收一个整数指针作为参数，将该指针指向的值增加10
func addPtr(ptr *int) {
	*ptr += 10
}

func main() {
	// 定义一个整数变量
	num := 5

	// 输出修改前的值
	fmt.Printf("变量num初始值: %d\n", num)

	// 调用addTen函数，传入num的地址
	addPtr(&num)
	// 输出修改后的值
	fmt.Printf("变量num作为参数传递给addPtr函数后: %d\n", num)
}
```



- 题目: 实现一个函数,接收一个整数切片的指针,将切片中的每个元素乘以2.
  - 考差点: 指针运算、切片操作.

### 示例2

```go
package main

import "fmt"

// multiSlice 函数接收一个整数切片的指针，将切片中的每个元素乘以2
func multiSlice(slicePtr *[]int) {
	// 遍历切片，将每个元素乘以2
	for i := 0; i < len(*slicePtr); i++ {
		(*slicePtr)[i] *= 2
	}
}

func main() {
	// 定义一个整数切片
	numbers := []int{1, 2, 3, 4, 5}

	// 输出修改前的切片
	fmt.Printf("numbers切片原始值: %v\n", numbers)

	// 调用multiSlice函数，传入切片的地址
	multiSlice(&numbers)

	// 输出修改后的切片
	fmt.Printf("numbers切片修改后值: %v\n", numbers)
}
```



## 二、`Goroutine`

- 题目: 编写一个程序,使用`Go`关键自动两个协程,一个协程打印从1到10的奇数,另一个协程打印从2到10的偶数.
  - 考察点: `Go`关键字的使用、协程的并发执行.

### 示例1

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

/* // 方式一(这样代码数量会少一些)
// chAddNumbers1 打印从1到10的奇数
func chAddNumbers1(wg *sync.WaitGroup) {
	defer wg.Done()

	for i := 1; i <= 10; i += 2 {
		fmt.Printf("chAddNumbers1奇数协程: %d\n", i)
		time.Sleep(100 * time.Millisecond) // 添加小延迟以便观察输出
	}
}

// chAddNumbers2 打印从2到10的偶数
func chAddNumbers2(wg *sync.WaitGroup) {
	defer wg.Done()

	for i := 2; i <= 10; i += 2 {
		fmt.Printf("chAddNumbers2偶数协程: %d\n", i)
		time.Sleep(100 * time.Millisecond) // 添加小延迟以便观察输出
	}
} */

// 方式二(这样代码数量会多一些,再for循环中需要增加if来判断是否是奇数或偶数)
// chAddNumbers1 打印从1到10的奇数
func chAddNumbers1(wg *sync.WaitGroup) {
	defer wg.Done()

	for i := 1; i <= 10; i++ {
		if i%2 == 1 {
			fmt.Printf("chAddNumbers1奇数协程: %d\n", i)
			time.Sleep(100 * time.Millisecond) // 添加小延迟以便观察输出
		}

	}
}

// chAddNumbers2 打印从2到10的偶数
func chAddNumbers2(wg *sync.WaitGroup) {
	defer wg.Done()

	for i := 2; i <= 10; i += 2 {
		if i%2 == 0 {
			fmt.Printf("chAddNumbers2偶数协程: %d\n", i)
			time.Sleep(100 * time.Millisecond) // 添加小延迟以便观察输出
		}
	}
}

func main() {
	// 创建WaitGroup用于等待协程完成
	var wg sync.WaitGroup

	fmt.Println("开始启动两个协程...")

	// 启动奇数协程
	wg.Add(1)
	go chAddNumbers1(&wg)

	// 启动偶数协程
	wg.Add(1)
	go chAddNumbers2(&wg)

	// 等待所有协程完成
	wg.Wait()

	fmt.Println("所有协程执行完毕!")
}
```



- 题目: 设计一个任务调度器,接收一组任务(可以用函数表示),并使用协程并发执行这些任务.同时统计每个任务的执行时间.
  - 考察点: 协程原理、并发任务调度.

### 示例2

```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Task 定义任务类型
type Task func(ctx context.Context) error

// TaskInfo 任务信息结构
type TaskInfo struct {
	ID   int
	Name string
	Task Task
}

// TaskResult 任务执行结果
type TaskResult struct {
	ID        int
	Name      string
	Duration  time.Duration
	Error     error
	StartTime time.Time
	EndTime   time.Time
}

// TaskScheduler 基于channel的任务调度器
type TaskScheduler struct {
	taskChan    chan TaskInfo
	resultChan  chan TaskResult
	doneChan    chan bool
	workerCount int
	ctx         context.Context
	cancel      context.CancelFunc
	workerWg    sync.WaitGroup
	resultWg    sync.WaitGroup
}

// NewTaskScheduler 创建新的任务调度器
func NewTaskScheduler(workerCount int) *TaskScheduler {
	ctx, cancel := context.WithCancel(context.Background())

	return &TaskScheduler{
		taskChan:    make(chan TaskInfo, 10),
		resultChan:  make(chan TaskResult, 10),
		doneChan:    make(chan bool),
		workerCount: workerCount,
		ctx:         ctx,
		cancel:      cancel,
	}
}

// Start 启动任务调度器
func (ts *TaskScheduler) Start() {
	fmt.Printf("启动任务调度器，工作协程数量: %d\n", ts.workerCount)

	// 启动工作协程池
	for i := 0; i < ts.workerCount; i++ {
		ts.workerWg.Add(1)
		go ts.worker(i)
	}

	// 启动结果收集协程
	ts.resultWg.Add(1)
	go ts.resultCollector()
}

// Stop 停止任务调度器
func (ts *TaskScheduler) Stop() {
	fmt.Println("正在停止任务调度器...")
	ts.cancel()
	close(ts.taskChan)

	// 等待工作协程完成
	ts.workerWg.Wait()

	// 关闭结果channel
	close(ts.resultChan)

	// 等待结果收集协程完成
	ts.resultWg.Wait()

	fmt.Println("任务调度器已停止")
}

// SubmitTask 提交任务
func (ts *TaskScheduler) SubmitTask(id int, name string, task Task) {
	select {
	case ts.taskChan <- TaskInfo{ID: id, Name: name, Task: task}:
		fmt.Printf("任务 '%s' 已提交\n", name)
	case <-ts.ctx.Done():
		fmt.Printf("任务 '%s' 提交失败，调度器已停止\n", name)
	}
}

// worker 工作协程
func (ts *TaskScheduler) worker(workerID int) {
	defer ts.workerWg.Done()

	fmt.Printf("工作协程 %d 启动\n", workerID)

	for {
		select {
		case taskInfo, ok := <-ts.taskChan:
			if !ok {
				fmt.Printf("工作协程 %d 退出\n", workerID)
				return
			}

			// 执行任务
			ts.executeTask(taskInfo)

		case <-ts.ctx.Done():
			fmt.Printf("工作协程 %d 收到停止信号\n", workerID)
			return
		}
	}
}

// executeTask 执行单个任务
func (ts *TaskScheduler) executeTask(taskInfo TaskInfo) {
	startTime := time.Now()

	fmt.Printf("工作协程开始执行任务: %s\n", taskInfo.Name)

	// 创建带超时的context
	taskCtx, cancel := context.WithTimeout(ts.ctx, 5*time.Second)
	defer cancel()

	// 执行任务
	err := taskInfo.Task(taskCtx)

	endTime := time.Now()
	duration := endTime.Sub(startTime)

	// 发送结果
	result := TaskResult{
		ID:        taskInfo.ID,
		Name:      taskInfo.Name,
		Duration:  duration,
		Error:     err,
		StartTime: startTime,
		EndTime:   endTime,
	}

	select {
	case ts.resultChan <- result:
		// 结果发送成功
	case <-ts.ctx.Done():
		// 调度器已停止，丢弃结果
	}
}

// resultCollector 结果收集协程
func (ts *TaskScheduler) resultCollector() {
	defer ts.resultWg.Done()

	var results []TaskResult
	var mu sync.Mutex

	// 收集所有结果
	for result := range ts.resultChan {
		mu.Lock()
		results = append(results, result)

		// 实时输出任务完成信息
		if result.Error != nil {
			fmt.Printf("任务 '%s' 执行失败: %v (耗时: %v)\n",
				result.Name, result.Error, result.Duration)
		} else {
			fmt.Printf("任务 '%s' 执行成功 (耗时: %v)\n",
				result.Name, result.Duration)
		}
		mu.Unlock()
	}

	// 打印最终摘要
	mu.Lock()
	ts.printSummary(results)
	mu.Unlock()

	// 发送完成信号
	select {
	case ts.doneChan <- true:
	case <-ts.ctx.Done():
	}
}

// printSummary 打印执行摘要
func (ts *TaskScheduler) printSummary(results []TaskResult) {
	fmt.Println("\n=== 任务执行摘要 ===")

	var totalDuration time.Duration
	successCount := 0

	for _, result := range results {
		totalDuration += result.Duration
		if result.Error == nil {
			successCount++
		}

		fmt.Printf("任务: %s | 耗时: %v | 状态: %s\n",
			result.Name,
			result.Duration,
			map[bool]string{true: "成功", false: "失败"}[result.Error == nil])
	}

	if len(results) > 0 {
		fmt.Printf("\n总任务数: %d\n", len(results))
		fmt.Printf("成功任务数: %d\n", successCount)
		fmt.Printf("失败任务数: %d\n", len(results)-successCount)
		fmt.Printf("总执行时间: %v\n", totalDuration)
		fmt.Printf("平均执行时间: %v\n", totalDuration/time.Duration(len(results)))
	}
}

// WaitForCompletion 等待所有任务完成
func (ts *TaskScheduler) WaitForCompletion() {
	select {
	case <-ts.doneChan:
		// 正常完成
	case <-time.After(5 * time.Second):
		fmt.Println("等待完成超时")
	}
}

// 示例任务函数
func simulateWork(name string, duration time.Duration) Task {
	return func(ctx context.Context) error {
		fmt.Printf("任务 '%s' 开始执行...\n", name)

		select {
		case <-time.After(duration):
			fmt.Printf("任务 '%s' 执行完成\n", name)
			return nil
		case <-ctx.Done():
			fmt.Printf("任务 '%s' 被取消\n", name)
			return ctx.Err()
		}
	}
}

func simulateErrorTask(name string) Task {
	return func(ctx context.Context) error {
		fmt.Printf("任务 '%s' 开始执行...\n", name)

		select {
		case <-time.After(500 * time.Millisecond):
			return fmt.Errorf("任务 '%s' 模拟执行失败", name)
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

func simulateLongTask(name string) Task {
	return func(ctx context.Context) error {
		fmt.Printf("任务 '%s' 开始执行...\n", name)

		// 模拟长时间运行的任务
		for i := 0; i < 10; i++ {
			select {
			case <-time.After(200 * time.Millisecond):
				fmt.Printf("任务 '%s' 进度: %d/10\n", name, i+1)
			case <-ctx.Done():
				fmt.Printf("任务 '%s' 被取消\n", name)
				return ctx.Err()
			}
		}

		fmt.Printf("任务 '%s' 执行完成\n", name)
		return nil
	}
}

func main() {
	// 创建任务调度器，使用3个工作协程
	scheduler := NewTaskScheduler(3)

	// 启动调度器
	scheduler.Start()

	// 提交各种任务
	scheduler.SubmitTask(1, "快速任务", simulateWork("快速任务", 200*time.Millisecond))
	scheduler.SubmitTask(2, "中等任务", simulateWork("中等任务", 500*time.Millisecond))
	scheduler.SubmitTask(3, "慢速任务", simulateWork("慢速任务", 800*time.Millisecond))
	scheduler.SubmitTask(4, "失败任务", simulateErrorTask("失败任务"))
	scheduler.SubmitTask(5, "长时间任务", simulateLongTask("长时间任务"))
	scheduler.SubmitTask(6, "计算任务", func(ctx context.Context) error {
		fmt.Printf("计算任务开始执行...\n")
		sum := 0
		for i := 0; i < 1000000; i++ {
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
				sum += i
			}
		}
		fmt.Printf("计算任务完成，结果: %d\n", sum)
		return nil
	})

	// 等待一段时间让任务执行
	time.Sleep(3 * time.Second)

	// 停止调度器
	scheduler.Stop()

	fmt.Println("程序执行完毕!")
}
```



## 三、面向对象

- 题目: 定义一个`Shape`接口,包含`Area()`和`Perimeter()`两个方法.然后创建`Rectangle`和`Circle`结构体,实现`Shape`接口.在主函数中,创建这两个结构体的实体,并调用它们的`Area()`和`Perimeter()`方法.
  - 考差点: 接口的定义与实现、面向对象编程风格.

### 示例1

```go
package main

import (
	"fmt"
	"math"
)

// Shape 定义形状接口
type Shape interface {
	Area() float64
	Perimeter() float64
}

// Rectangle 矩形结构体
type Rectangle struct {
	Width  float64
	Height float64
}

// Area 计算矩形面积
func (r Rectangle) Area() float64 {
	return r.Width * r.Height
}

// Perimeter 计算矩形周长
func (r Rectangle) Perimeter() float64 {
	return 2 * (r.Width + r.Height)
}

// Circle 圆形结构体
type Circle struct {
	Radius float64
}

// Area 计算圆形面积
func (c Circle) Area() float64 {
	return math.Pi * c.Radius * c.Radius
}

// Perimeter 计算圆形周长
func (c Circle) Perimeter() float64 {
	return 2 * math.Pi * c.Radius
}

// printShapeInfo 打印形状信息的通用函数
func printShapeInfo(s Shape, name string) {
	fmt.Printf("%s:\n", name)
	fmt.Printf("  面积: %.2f\n", s.Area())
	fmt.Printf("  周长: %.2f\n", s.Perimeter())
	fmt.Println()
}

func main() {
	fmt.Println("=== 形状计算程序 ===")
	fmt.Println()

	// 创建矩形实例
	rectangle := Rectangle{
		Width:  5.0,
		Height: 3.0,
	}

	// 创建圆形实例
	circle := Circle{
		Radius: 4.0,
	}

	// 调用方法并打印结果
	printShapeInfo(rectangle, "矩形")
	printShapeInfo(circle, "圆形")

	// 演示接口的多态性
	fmt.Println("=== 使用接口切片演示多态性 ===")
	shapes := []Shape{
		Rectangle{Width: 6.0, Height: 4.0},
		Circle{Radius: 3.0},
		Rectangle{Width: 8.0, Height: 2.0},
		Circle{Radius: 5.0},
	}

	for i, shape := range shapes {
		switch s := shape.(type) {
		case Rectangle:
			fmt.Printf("形状 %d - 矩形 (宽: %.1f, 高: %.1f)\n", i+1, s.Width, s.Height)
		case Circle:
			fmt.Printf("形状 %d - 圆形 (半径: %.1f)\n", i+1, s.Radius)
		}
		fmt.Printf("  面积: %.2f\n", shape.Area())
		fmt.Printf("  周长: %.2f\n", shape.Perimeter())
		fmt.Println()
	}

	// 计算总面积和总周长
	var totalArea, totalPerimeter float64
	for _, shape := range shapes {
		totalArea += shape.Area()
		totalPerimeter += shape.Perimeter()
	}

	fmt.Printf("所有形状的总面积: %.2f\n", totalArea)
	fmt.Printf("所有形状的总周长: %.2f\n", totalPerimeter)
}
```



- 题目: 使用组合的方式创建一个`Person`结构体,包含`Name`和`Age`字段,再创建一个`Employee`结构体,组合`Person`结构体并添加`EmployeeID`字段.为`Eployee`结构体实现一个`PrintInfo()`方法,输出员工的信息.
  - 考察点: 组合的使用、方法接收者.

### 示例2

```go
package main

import "fmt"

// Person 人员基础结构体
type Person struct {
	Name string
	Age  int
}

// Employee 员工结构体，组合了Person
type Employee struct {
	Person     // 嵌入Person结构体
	EmployeeID string
	Department string
	Salary     float64
}

// PrintInfo 打印员工信息的方法
func (e Employee) PrintInfo() {
	fmt.Println("=== 员工信息 ===")
	fmt.Printf("姓名: %s\n", e.Name)
	fmt.Printf("年龄: %d岁\n", e.Age)
	fmt.Printf("员工ID: %s\n", e.EmployeeID)
	fmt.Printf("部门: %s\n", e.Department)
	fmt.Printf("薪资: %.2f元\n", e.Salary)
	fmt.Println()
}

// GetFullInfo 获取员工完整信息的字符串
func (e Employee) GetFullInfo() string {
	return fmt.Sprintf("员工[%s] %s, %d岁, %s部门, 薪资%.2f元",
		e.EmployeeID, e.Name, e.Age, e.Department, e.Salary)
}

// Promote 员工升职方法
func (e *Employee) Promote(newDepartment string, salaryIncrease float64) {
	e.Department = newDepartment
	e.Salary += salaryIncrease
	fmt.Printf("%s 升职到 %s 部门，薪资调整为 %.2f元\n", e.Name, newDepartment, e.Salary)
}

func main() {
	fmt.Println("=== Go语言结构体组合示例 ===")
	fmt.Println()

	// 创建Person实例
	person := Person{
		Name: "张三",
		Age:  28,
	}
	fmt.Printf("Person实例: %s, %d岁\n", person.Name, person.Age)
	fmt.Println()

	// 创建Employee实例（使用组合）
	employee1 := Employee{
		Person: Person{
			Name: "李四",
			Age:  30,
		},
		EmployeeID: "EMP001",
		Department: "技术部",
		Salary:     15000.0,
	}

	// 创建Employee实例（另一种方式）
	employee2 := Employee{
		Person:     Person{Name: "王五", Age: 25},
		EmployeeID: "EMP002",
		Department: "销售部",
		Salary:     12000.0,
	}

	// 创建Employee实例（使用字段名）
	employee3 := Employee{}
	employee3.Name = "赵六"
	employee3.Age = 32
	employee3.EmployeeID = "EMP003"
	employee3.Department = "人事部"
	employee3.Salary = 13000.0

	// 调用PrintInfo方法
	employee1.PrintInfo()
	employee2.PrintInfo()
	employee3.PrintInfo()

	// 演示方法调用
	fmt.Println("=== 方法调用演示 ===")
	fmt.Println(employee1.GetFullInfo())
	fmt.Println(employee2.GetFullInfo())
	fmt.Println(employee3.GetFullInfo())
	fmt.Println()

	// 演示指针接收者方法
	fmt.Println("=== 升职演示 ===")
	employee1.Promote("技术总监", 5000.0)
	employee2.Promote("销售经理", 3000.0)
	fmt.Println()

	// 演示组合的优势：可以直接访问嵌入结构体的字段
	fmt.Println("=== 组合优势演示 ===")
	fmt.Printf("员工 %s 的姓名: %s\n", employee1.EmployeeID, employee1.Name)
	fmt.Printf("员工 %s 的年龄: %d\n", employee1.EmployeeID, employee1.Age)
	fmt.Printf("员工 %s 的部门: %s\n", employee1.EmployeeID, employee1.Department)

	// 创建员工切片
	fmt.Println("\n=== 员工列表 ===")
	employees := []Employee{employee1, employee2, employee3}

	for i, emp := range employees {
		fmt.Printf("%d. %s\n", i+1, emp.GetFullInfo())
	}

	// 计算平均薪资
	var totalSalary float64
	for _, emp := range employees {
		totalSalary += emp.Salary
	}
	avgSalary := totalSalary / float64(len(employees))
	fmt.Printf("\n平均薪资: %.2f元\n", avgSalary)
}
```





## 四、`Channel`

- 题目: 编写一个程序,使用通道实现两个协程之间的通信.一个协程生成从1到10的整数,并将这些整数发送到通道中,另一个协程从通道中接收这些整数并打印出来.
  - 考察点: 通道的基本使用、协程间通信

### 示例1

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// producer 生产者协程：生成1到10的整数并发送到通道
func producer(ch chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	defer close(ch) // 关闭通道，通知消费者没有更多数据

	fmt.Println("生产者协程启动，开始生成数据...")

	for i := 1; i <= 10; i++ {
		fmt.Printf("生产者发送: %d\n", i)
		ch <- i // 发送数据到通道
		time.Sleep(100 * time.Millisecond)
	}

	fmt.Println("生产者协程完成，已发送所有数据")
}

// consumer 消费者协程：从通道接收整数并打印
func consumer(ch <-chan int, wg *sync.WaitGroup) {
	defer wg.Done()

	fmt.Println("消费者协程启动，开始接收数据...")

	for value := range ch {
		fmt.Printf("消费者接收: %d\n", value)
		time.Sleep(150 * time.Millisecond)
	}

	fmt.Println("消费者协程完成，通道已关闭")
}

func main() {
	fmt.Println("=== Go语言通道通信示例 ===")
	fmt.Println()

	// 创建无缓冲通道
	ch := make(chan int)

	// 创建WaitGroup用于同步协程
	var wg sync.WaitGroup

	// 启动生产者协程
	wg.Add(1)
	go producer(ch, &wg)

	// 启动消费者协程
	wg.Add(1)
	go consumer(ch, &wg)

	// 等待所有协程完成
	wg.Wait()

	fmt.Println("\n=== 程序执行完毕 ===")
}
```



- 题目: 实现一个带有缓冲的通道,生产者协程向通道中发送100个整数,消费者协程从通道中接口这些整数并打印.
  - 考察点: 通道的缓冲机制

### 示例2

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// producer 生产者协程：向带缓冲通道发送100个整数
func producer(ch chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	defer close(ch) // 关闭通道，通知消费者没有更多数据

	fmt.Println("生产者协程启动，开始发送100个整数...")

	for i := 1; i <= 100; i++ {
		ch <- i // 发送数据到带缓冲通道

		// 每发送10个数字输出一次进度
		if i%10 == 0 {
			fmt.Printf("生产者已发送: %d/100\n", i)
		}

		// 添加小延迟以便观察
		time.Sleep(10 * time.Millisecond)
	}

	fmt.Println("生产者协程完成，已发送所有100个整数")
}

// consumer 消费者协程：从带缓冲通道接收整数并打印
func consumer(ch <-chan int, wg *sync.WaitGroup) {
	defer wg.Done()

	fmt.Println("消费者协程启动，开始接收数据...")

	count := 0
	for value := range ch {
		count++

		// 每接收10个数字输出一次进度
		if count%10 == 0 {
			fmt.Printf("消费者已接收: %d个数字，当前数字: %d\n", count, value)
		}

		// 添加小延迟以便观察
		time.Sleep(15 * time.Millisecond)
	}

	fmt.Printf("消费者协程完成，总共接收了 %d 个整数\n", count)
}

func main() {
	fmt.Println("=== Go语言带缓冲通道通信示例 ===")
	fmt.Println()

	// 创建带缓冲的通道，缓冲区大小为20
	ch := make(chan int, 20)

	// 创建WaitGroup用于同步协程
	var wg sync.WaitGroup

	// 启动生产者协程
	wg.Add(1)
	go producer(ch, &wg)

	// 启动消费者协程
	wg.Add(1)
	go consumer(ch, &wg)

	// 等待所有协程完成
	wg.Wait()

	fmt.Println("\n=== 程序执行完毕 ===")

	// 演示带缓冲通道的优势
	fmt.Println("\n=== 带缓冲通道 vs 无缓冲通道对比 ===")
	demonstrateBufferedChannel()
}

// demonstrateBufferedChannel 演示带缓冲通道的优势
func demonstrateBufferedChannel() {
	fmt.Println("带缓冲通道的优势:")
	fmt.Println("- 生产者可以连续发送多个数据而不需要等待消费者")
	fmt.Println("- 消费者可以批量接收数据，提高效率")
	fmt.Println("- 减少协程间的阻塞等待时间")
	fmt.Println("- 适合生产者和消费者速度不匹配的场景")

	// 创建小缓冲通道演示
	ch := make(chan int, 3)

	go func() {
		for i := 1; i <= 5; i++ {
			fmt.Printf("快速发送: %d\n", i)
			ch <- i
		}
		close(ch)
	}()

	time.Sleep(200 * time.Millisecond) // 让生产者先发送一些数据

	for value := range ch {
		fmt.Printf("慢速接收: %d\n", value)
		time.Sleep(300 * time.Millisecond)
	}
}
```



## 五、锁机制

- 题目: 编写一个程序,使用`sync.Mutex`来博爱湖一个共享的计数器.启动10个协程,每个协程对计数器进行1000次递增操作,最后输出计数器的值.
  - 考察点: `sync.Mutex`的使用、并发数据安全

### 示例1

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// Counter 共享计数器结构体
type Counter struct {
	value int
	mutex sync.Mutex
}

// Increment 安全地递增计数器
func (c *Counter) Increment() {
	c.mutex.Lock()         // 获取锁
	defer c.mutex.Unlock() // 确保锁被释放

	c.value++
}

// GetValue 安全地获取计数器值
func (c *Counter) GetValue() int {
	c.mutex.Lock()         // 获取锁
	defer c.mutex.Unlock() // 确保锁被释放

	return c.value
}

// IncrementWorker 工作协程函数
func IncrementWorker(counter *Counter, workerID int, iterations int, wg *sync.WaitGroup) {
	defer wg.Done()

	fmt.Printf("工作协程 %d 开始执行，将进行 %d 次递增操作\n", workerID, iterations)

	for i := 0; i < iterations; i++ {
		counter.Increment()

		// 每100次操作输出一次进度
		if (i+1)%100 == 0 {
			fmt.Printf("工作协程 %d 已完成 %d 次操作\n", workerID, i+1)
		}
	}

	fmt.Printf("工作协程 %d 完成所有操作\n", workerID)
}

func main() {
	fmt.Println("=== Go语言互斥锁(Mutex)保护共享资源示例 ===")
	fmt.Println()

	// 创建共享计数器
	counter := &Counter{value: 0}

	// 创建WaitGroup用于同步协程
	var wg sync.WaitGroup

	// 记录开始时间
	startTime := time.Now()

	// 启动10个工作协程
	numWorkers := 10
	iterationsPerWorker := 1000

	fmt.Printf("启动 %d 个工作协程，每个协程将进行 %d 次递增操作\n", numWorkers, iterationsPerWorker)
	fmt.Printf("预期最终结果: %d\n", numWorkers*iterationsPerWorker)
	fmt.Println()

	for i := 1; i <= numWorkers; i++ {
		wg.Add(1)
		go IncrementWorker(counter, i, iterationsPerWorker, &wg)
	}

	// 等待所有协程完成
	wg.Wait()

	// 记录结束时间
	endTime := time.Now()
	duration := endTime.Sub(startTime)

	// 输出最终结果
	fmt.Println()
	fmt.Println("=== 执行结果 ===")
	fmt.Printf("最终计数器值: %d\n", counter.GetValue())
	fmt.Printf("预期值: %d\n", numWorkers*iterationsPerWorker)
	fmt.Printf("执行时间: %v\n", duration)

	// 验证结果是否正确
	if counter.GetValue() == numWorkers*iterationsPerWorker {
		fmt.Println("✓ 结果正确！互斥锁成功保护了共享资源")
	} else {
		fmt.Println("× 结果错误！可能存在竞态条件")
	}

	// 演示不使用互斥锁的问题
	fmt.Println("\n=== 演示不使用互斥锁的问题 ===")
	demonstrateRaceCondition()
}

// demonstrateRaceCondition 演示竞态条件问题
func demonstrateRaceCondition() {
	fmt.Println("不使用互斥锁的情况:")

	// 不安全的计数器
	unsafeCounter := 0
	var wg sync.WaitGroup

	// 启动多个协程同时修改不安全的计数器
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				unsafeCounter++ // 不安全的操作
			}
		}()
	}

	wg.Wait()
	fmt.Printf("不安全计数器的值: %d (预期: 5000)\n", unsafeCounter)

	if unsafeCounter != 5000 {
		fmt.Println("× 出现了竞态条件！结果不正确")
	} else {
		fmt.Println("✓ 这次运气好，没有出现竞态条件")
	}
}
```



- 题目; 使用原子操作(`sync/atomic`包)实现一个无锁的计数器.启动10个协程,每个携程对计数器进行1000次递增操作,最后输出计数器的值.
  - 考察点: 原子操作、并发数据安全

### 示例2

```go
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
```


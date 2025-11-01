# `GO`基础部分作业

### 一、流程控制

#### **示例代码**

- 求出现次数为一次的数字

> 给定一个非空整数数组,除了某个元素只出现一次以外,其余每个元素均出现两次.找出那个只出现了一次的元素.可以使用 `for`循环遍历数组,结合 `if` 条件判断和 `map` 数据结构来解决,例如通过 `map` 记录每个元素出现的次数,然后再遍历 `map` 找到出现次数为1的元素.

```go
package main

import "fmt"

func main() {
	// 测试用例
	TmpNums := [][]int{
		{2, 2, 1},
		{4, 1, 2, 1, 2},
		{1},
	}

	for _, TmpNum := range TmpNums {
		fmt.Printf("数组 %v 中只出现一次的元素是: %d\n", TmpNum, singleNumber(TmpNum))
	}
}

func singleNumber(nums []int) int {
	result := 0
	for _, num := range nums {
		result ^= num
	}

	return result
}
```





### 二、字符串

### 2.1.有效括号

#### 代码示例

> **给定一个只包括 `'('`，`')'`，`'{'`，`'}'`，`'['`，`']'` 的字符串 `s` ,判断字符串是否有效.**

```go
package main

import "fmt"

func main() {
	// 测试用例
	TemExamples := []struct {
		input    string
		expected bool
		desc     string
	}{
		{"()", true, "简单匹配"},
		{"()[]{}", true, "多种括号"},
		{"(]", false, "类型不匹配"},
		{"([)]", false, "交叉不匹配"},
		{"{[]}", true, "嵌套匹配"},
		{"", true, "空字符串"},
		{"((", false, "只有左括号"},
		{"))", false, "只有右括号"},
		{"({})", true, "复杂嵌套"},
		{"({[]})", true, "多层嵌套"},
	}

	fmt.Println("=== 括号匹配测试 ===")
	for _, te := range TemExamples {
		result := isValid(te.input)
		status := "✓"
		if result != te.expected {
			status = "×"
		}
		fmt.Printf("%s %s => %v (%s)\n", status, te.input, result, te.desc)
	}

	// 演示详细过程
	fmt.Println("\n=== 详细匹配过程 ===")
	demostrateProcess("({[]})")

}

// 演示匹配过程
func demostrateProcess(s string) {
	fmt.Printf("输入: %s\n", s)
	stack := []rune{}

	pairs := map[rune]rune{
		')': '(',
		'}': '{',
		']': '[',
	}

	for i, char := range s {
		fmt.Printf("\n步骤 %d: 处理 '%c'\n", i+1, char)

		if leftBracket, ok := pairs[char]; ok {
			// 右括号
			if len(stack) == 0 {
				fmt.Println("  栈为空,无法匹配")
				return
			}
			if stack[len(stack)-1] != leftBracket {
				fmt.Printf("  栈顶 '%c'与'%c' 不匹配\n", stack[len(stack)-1], char)
				return
			}
			fmt.Printf(" 匹配成功! 弹出 '%c'\n", stack[len(stack)-1])
			stack = stack[:len(stack)-1]
		} else {
			// 左括号
			stack = append(stack, char)
			fmt.Printf("  左括号,入栈\n")
		}
		fmt.Printf("  当前栈: %c\n", stack)
	}
	if len(stack) == 0 {
		fmt.Println("\n结果: 有效 ✓")
	} else {
		fmt.Printf("\n结果: 无效 × (栈中还剩: %c\n)", stack)
	}
}

func isValid(s string) bool {
	if len(s)%2 == 1 {
		return false
	}

	paris := map[rune]rune{
		')': '(',
		'}': '{',
		']': '[',
	}

	stack := []rune{}

	for _, char := range s {
		if leftBracket, ok := paris[char]; ok {
			if len(stack) == 0 || stack[len(stack)-1] != leftBracket {
				return false
			}
			stack = stack[:len(stack)-1]
		} else {
			stack = append(stack, char)
		}
	}

	return len(stack) == 0
}
```



### 2.2.最长公共前缀

> **写一个函数来查找字符串数组中的最长公共前缀**

#### 示例代码

```go
package main

import "fmt"

// 查找字符串数组中的最长公共前缀
func longestCommonPrefix(strs []string) string {
	if len(strs) == 0 {
		return ""
	}

	// 以第一个字符串为基准，逐个字符检查
	for i := 0; i < len(strs[0]); i++ {
		char := strs[0][i]

		// 检查其他字符串的相同位置
		for j := 1; j < len(strs); j++ {
			// 如果超出长度或字符不同，返回当前前缀
			if i >= len(strs[j]) || strs[j][i] != char {
				return strs[0][:i]
			}
		}
	}

	// 第一个字符串就是最长公共前缀
	return strs[0]
}

func main() {
	// 测试示例1
	strs1 := []string{"flower", "flow", "flight"}
	fmt.Printf("输入: %v\n", strs1)
	fmt.Printf("最长公共前缀: \"%s\"\n\n", longestCommonPrefix(strs1))

	// 测试示例2
	strs2 := []string{"dog", "racecar", "car"}
	fmt.Printf("输入: %v\n", strs2)
	fmt.Printf("最长公共前缀: \"%s\"\n\n", longestCommonPrefix(strs2))

	// 测试示例3
	strs3 := []string{"interview", "internet", "internal"}
	fmt.Printf("输入: %v\n", strs3)
	fmt.Printf("最长公共前缀: \"%s\"\n", longestCommonPrefix(strs3))
}
```



### 三、基本值类型

> 给定一个由整数组成的非空数组所表示的非负整数,在该数的基础上加一

#### 示例代码

```go
package main

import "fmt"

// 给数组表示的整数加一
func plusOne(digits []int) []int {
	// 从最后一位开始处理
	for i := len(digits) - 1; i >= 0; i-- {
		// 当前位加1
		digits[i]++

		// 如果没有进位(小于10),直接返回
		if digits[i] < 10 {
			return digits
		}

		// 有进位,当前位设为0,继续处理前一位
		digits[i] = 0
	}

	// 如果所有位都进位了,需要在最前面加1
	return append([]int{1}, digits...)
}

func main() {
	// 示例1: 普通情况
	digits1 := []int{1, 2, 3}
	fmt.Printf("输入: %v\n", digits1)
	fmt.Printf("输出: %v\n", plusOne(digits1))

	// 示例2: 有进位
	digits2 := []int{1, 2, 9}
	fmt.Printf("输入: %v\n", digits2)
	fmt.Printf("输出: %v\n", plusOne(digits2))

	// 示例3: 继续进位
	digits3 := []int{9, 9, 9}
	fmt.Printf("输入: %v\n", digits3)
	fmt.Printf("输出: %v\n", plusOne(digits3))

	// 示例4: 单个数字
	digits4 := []int{9}
	fmt.Printf("输入: %v\n", digits4)
	fmt.Printf("输出: %v\n", plusOne(digits4))
}
```



### 四、引用类型(切片)

#### 4.1.删除有序数组中的重复项

> **给一个有序数组 `nums` ,请原地删除重复出现的元素,使每个元素只出现一次,返回删除后数组的新长度.不要使用额外的数组空间,必须在原地修改输入数组并在使用`O(1)`额外空间的条件下完成.可以使用双指针法,一个慢指针 `i` 用于记录不重复元素的位置,一个快指针 `j` 用于遍历数组,当 `nums[i]` 与 `nums[j]` 不相等时,将 `nums[j]` 赋值给 `nums[i + 1]`,并将 `i` 后移一位.**

##### 代码示例

```go
package main

import "fmt"

// 删除有序数组中的重复项
func removeDuplicates(nums []int) int {
	if len(nums) == 0 {
		return 0
	}

	// 慢指针i指向不重复元素的最后位置
	i := 0

	// 慢指针j遍历数组
	for j := 1; j < len(nums); j++ {
		// 发现不同元素
		if nums[i] != nums[j] {
			i++               // 慢指针迁移
			nums[i] = nums[j] // 将不同元素放到正确位置
		}
	}

	// 返回不重复元素的个数
	return i + 1
}

func main() {
	// 测试示例1
	nums1 := []int{1, 2, 3}
	fmt.Printf("输入: %v\n", nums1)
	length1 := removeDuplicates(nums1)
	fmt.Printf("输出: %d, nums = %v\n\n", length1, nums1[:length1])

	// 测试示例2
	nums2 := []int{0, 0, 1, 1, 1, 2, 2, 3, 3, 4}
	fmt.Printf("输入: %v\n", nums2)
	length2 := removeDuplicates(nums2)
	fmt.Printf("输出: %d, nums = %v\n\n", length2, nums2[:length2])

	// 测试示例3: 没有重复
	nums3 := []int{1, 2, 3, 4, 5}
	fmt.Printf("输入: %v\n", nums3)
	length3 := removeDuplicates(nums3)
	fmt.Printf("输出: %d, nums = %v\n\n", length3, nums3[:length3])

	// 测试示例4: 全部相同
	nums4 := []int{1, 1, 1, 1, 1}
	fmt.Printf("输入: %v\n", nums4)
	length4 := removeDuplicates(nums4)
	fmt.Printf("输出: %d, nums = %v\n", length4, nums4[:length4])
}
```



#### 4.2.合并区间

> **以数组 `intervals` 表示若干个区间的集合,其中单个区间为 `intervals[i] = [starti, endi]` .请你合并所有重叠的区间,并返回一个不重叠的区间数组,该数组需恰好覆盖输入中的所有区间.可以先对区间数组按照区间的起始位置进行排序,然后使用一个切片来存储合并后的区间,遍历排序后的区间数组,将当前区间与切片中最后一个区间进行比较,如果有重叠,则合并区间;如果没有重叠,则将当前区间添加到切片中.**

##### 代码示例

```go
package main

import (
	"fmt"
	"sort"
)

// 合并重叠区间
func merge(intervals [][]int) [][]int {
	if len(intervals) <= 1 {
		return intervals
	}

	// 1.按照区间起位置排序
	sort.Slice(intervals, func(i, j int) bool {
		return intervals[i][0] < intervals[j][0]
	})

	// 2.用于存储合并后的区间
	merged := [][]int{intervals[0]}

	// 3.遍历排序后的区间
	for i := 1; i < len(intervals); i++ {
		// 获取merge中最后一个区间
		last := merged[len(merged)-1]
		current := intervals[i]

		// 判断是否有重叠
		if last[1] >= current[0] {
			// 有重叠,合并区间
			last[1] = max(last[1], current[1])
		} else {
			// 没有重叠,添加当前区间
			merged = append(merged, current)
		}
	}

	return merged
}

// 辅助函数: 求最大值
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func main() {
	// 测试示例1: 基本重叠
	intervals1 := [][]int{{1, 3}, {2, 6}, {8, 10}, {15, 18}}
	fmt.Printf("输入: %v\n", intervals1)
	fmt.Printf("输出: %v\n\n", merge(intervals1))

	// 测试示例2: 完全包含
	intervals2 := [][]int{{1, 4}, {4, 5}}
	fmt.Printf("输入: %v\n", intervals2)
	fmt.Printf("输出: %v\n\n", merge(intervals2))

	// 测试示例3: 多重重叠
	intervals3 := [][]int{{1, 4}, {0, 4}}
	fmt.Printf("输入: %v\n", intervals3)
	fmt.Printf("输出: %v\n\n", merge(intervals3))

	// 测试示例4: 无重叠
	intervals4 := [][]int{{1, 2}, {3, 4}, {5, 6}}
	fmt.Printf("输入: %v\n", intervals4)
	fmt.Printf("输出: %v\n", merge(intervals4))
}
```





### 五、基础

#### 5.1.两数之和

>  **给定一个整数数组 nums 和一个目标值`target`,请在该数组中找出和为目标值的那两个整数**



##### 代码示例

```go
package main

import (
	"fmt"
	"sort"
)

// 方法1: 哈希表法(推荐)
// 时间复杂度: O(n),空间复杂度: O(n)
func twoSum(nums []int, target int) []int {
	// 使用哈希表存储已遍历的数字及其索引
	hashMap := make(map[int]int)

	for i, num := range nums {
		// 计算需要的另一个数
		complement := target - num

		// 检查哈希表中是否存在
		if j, exists := hashMap[complement]; exists {
			return []int{j, i}
		}

		// 将当前数字存入哈西表
		hashMap[num] = i
	}
	return nil // 无解
}

// 方法2: 暴力法
// 时间复杂度: O(n²),空间复杂度: O(1)
func twoSumBruteForce(nums []int, target int) []int {
	for i := 0; i < len(nums); i++ {
		for j := i + 1; j < len(nums); j++ {
			if nums[i]+nums[j] == target {
				return []int{i, j}
			}
		}
	}
	return nil
}

// 方法3: 双指针法(需要排序,会改变原数据索引)
// 适用于只需要找到数值,不需要原始索引的情况
func twoSumTwoPointers(nums []int, target int) []int {
	// 创建带索引的结构体
	type numWithIndex struct {
		value int
		index int
	}

	// 构建带索引的数组
	indexed := make([]numWithIndex, len(nums))
	for i, num := range nums {
		indexed[i] = numWithIndex{value: num, index: i}
	}

	// 按值排序
	sort.Slice(indexed, func(i, j int) bool {
		return indexed[i].value < indexed[j].value
	})

	// 双指针查找
	left, right := 0, len(indexed)-1

	for left < right {
		sum := indexed[left].value + indexed[right].value

		if sum == target {
			// 返回原始索引
			return []int{indexed[left].index, indexed[right].index}
		} else if sum < target {
			left++
		} else {
			right--
		}
	}

	return nil
}

func main() {
	// 测试示例1
	nums1 := []int{2, 7, 11, 15}
	target1 := 9
	fmt.Printf("输入: nums = %v,target = %d\n", nums1, target1)
	fmt.Printf("输出: %v\n\n", twoSum(nums1, target1))

	// 测试示例2
	nums2 := []int{3, 2, 4}
	target2 := 6
	fmt.Printf("输入: nums = %v, target = %d\n", nums2, target2)
	fmt.Printf("输出: %v\n\n", twoSum(nums2, target2))

	// 测试示例3
	nums3 := []int{3, 3}
	target3 := 6
	fmt.Printf("输入: nums = %v, target = %d\n", nums3, target3)
	fmt.Printf("输出: %v\n", twoSum(nums3, target3))
}
```

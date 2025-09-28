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

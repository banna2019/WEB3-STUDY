// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title BinarySearch
 * @dev 在有序数组中查找目标值的合约（使用二分查找法）
 * @notice 数组必须是升序排列的，时间复杂度 O(log n)
 */
contract BinarySearch {
    
    /**
     * @dev 在有序数组中查找目标值（返回索引）
     * @param nums 有序数组（升序）
     * @param target 目标值
     * @return 如果找到返回目标值的索引，否则返回 type(uint256).max 表示未找到
     * 
     * 算法: 二分查找法
     * - 时间复杂度: O(log n)
     * - 空间复杂度: O(1)
     */
    function binarySearch(
        uint256[] memory nums,
        uint256 target
    ) public pure returns (uint256) {
        uint256 left = 0;
        uint256 right = nums.length;
        
        // 二分查找
        while (left < right) {
            uint256 mid = left + (right - left) / 2;
            
            if (nums[mid] == target) {
                return mid; // 找到目标值
            } else if (nums[mid] < target) {
                left = mid + 1; // 目标值在右半部分
            } else {
                right = mid; // 目标值在左半部分
            }
        }
        
        // 未找到目标值
        return type(uint256).max;
    }
    
    /**
     * @dev 在有序数组中查找目标值（返回是否存在）
     * @param nums 有序数组（升序）
     * @param target 目标值
     * @return 如果找到返回 true，否则返回 false
     */
    function search(
        uint256[] memory nums,
        uint256 target
    ) public pure returns (bool) {
        uint256 index = binarySearch(nums, target);
        return index != type(uint256).max;
    }
    
    /**
     * @dev 查找目标值第一次出现的索引
     * @param nums 有序数组（升序，可能包含重复元素）
     * @param target 目标值
     * @return 第一次出现的索引，未找到返回 type(uint256).max
     */
    function findFirst(
        uint256[] memory nums,
        uint256 target
    ) public pure returns (uint256) {
        uint256 left = 0;
        uint256 right = nums.length;
        uint256 result = type(uint256).max;
        
        while (left < right) {
            uint256 mid = left + (right - left) / 2;
            
            if (nums[mid] >= target) {
                if (nums[mid] == target) {
                    result = mid; // 记录找到的位置
                }
                right = mid; // 继续在左半部分查找更早的出现
            } else {
                left = mid + 1;
            }
        }
        
        return result;
    }
    
    /**
     * @dev 查找目标值最后一次出现的索引
     * @param nums 有序数组（升序，可能包含重复元素）
     * @param target 目标值
     * @return 最后一次出现的索引，未找到返回 type(uint256).max
     */
    function findLast(
        uint256[] memory nums,
        uint256 target
    ) public pure returns (uint256) {
        uint256 left = 0;
        uint256 right = nums.length;
        uint256 result = type(uint256).max;
        
        while (left < right) {
            uint256 mid = left + (right - left) / 2;
            
            if (nums[mid] <= target) {
                if (nums[mid] == target) {
                    result = mid; // 记录找到的位置
                }
                left = mid + 1; // 继续在右半部分查找更晚的出现
            } else {
                right = mid;
            }
        }
        
        return result;
    }
    
    /**
     * @dev 查找插入位置（保持数组有序）
     * @param nums 有序数组（升序）
     * @param target 目标值
     * @return 插入位置的索引
     * 
     * 返回最小的索引，使得在该位置插入目标值后数组仍保持有序
     */
    function searchInsert(
        uint256[] memory nums,
        uint256 target
    ) public pure returns (uint256) {
        uint256 left = 0;
        uint256 right = nums.length;
        
        while (left < right) {
            uint256 mid = left + (right - left) / 2;
            
            if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        
        return left;
    }
    
    /**
     * @dev 查找小于目标值的最大元素索引
     * @param nums 有序数组（升序）
     * @param target 目标值
     * @return 小于目标值的最大元素索引，未找到返回 type(uint256).max
     */
    function findLowerBound(
        uint256[] memory nums,
        uint256 target
    ) public pure returns (uint256) {
        uint256 left = 0;
        uint256 right = nums.length;
        uint256 result = type(uint256).max;
        
        while (left < right) {
            uint256 mid = left + (right - left) / 2;
            
            if (nums[mid] < target) {
                result = mid; // 记录满足条件的索引
                left = mid + 1; // 继续在右半部分查找更大的值
            } else {
                right = mid;
            }
        }
        
        return result;
    }
    
    /**
     * @dev 查找大于目标值的最小元素索引
     * @param nums 有序数组（升序）
     * @param target 目标值
     * @return 大于目标值的最小元素索引，未找到返回 type(uint256).max
     */
    function findUpperBound(
        uint256[] memory nums,
        uint256 target
    ) public pure returns (uint256) {
        uint256 left = 0;
        uint256 right = nums.length;
        uint256 result = type(uint256).max;
        
        while (left < right) {
            uint256 mid = left + (right - left) / 2;
            
            if (nums[mid] <= target) {
                left = mid + 1;
            } else {
                result = mid; // 记录满足条件的索引
                right = mid; // 继续在左半部分查找更小的值
            }
        }
        
        return result;
    }
    
    /**
     * @dev 验证数组是否已排序（升序）
     * @param nums 待验证的数组
     * @return 是否已排序
     */
    function isSorted(uint256[] memory nums) public pure returns (bool) {
        if (nums.length <= 1) {
            return true;
        }
        
        for (uint256 i = 0; i < nums.length - 1; i++) {
            if (nums[i] > nums[i + 1]) {
                return false;
            }
        }
        
        return true;
    }
}


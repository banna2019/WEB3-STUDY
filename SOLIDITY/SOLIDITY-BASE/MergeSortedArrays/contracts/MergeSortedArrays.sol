// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title MergeSortedArrays
 * @dev 将两个有序数组合并为一个有序数组的合约
 * @notice 使用双指针算法实现高效合并
 */
contract MergeSortedArrays {
    
    /**
     * @dev 合并两个有序数组
     * @param nums1 第一个有序数组（升序）
     * @param nums2 第二个有序数组（升序）
     * @return 合并后的有序数组（升序）
     * 
     * 算法: 使用双指针技术，时间复杂度 O(m+n)
     */
    function mergeSortedArrays(
        uint256[] memory nums1,
        uint256[] memory nums2
    ) public pure returns (uint256[] memory) {
        uint256 m = nums1.length;
        uint256 n = nums2.length;
        
        // 创建结果数组
        uint256[] memory result = new uint256[](m + n);
        
        // 双指针: i 指向 nums1, j 指向 nums2, k 指向 result
        uint256 i = 0;
        uint256 j = 0;
        uint256 k = 0;
        
        // 同时遍历两个数组，选择较小的元素
        while (i < m && j < n) {
            if (nums1[i] <= nums2[j]) {
                result[k] = nums1[i];
                i++;
            } else {
                result[k] = nums2[j];
                j++;
            }
            k++;
        }
        
        // 将剩余元素添加到结果数组
        // nums1 还有剩余元素
        while (i < m) {
            result[k] = nums1[i];
            i++;
            k++;
        }
        
        // nums2 还有剩余元素
        while (j < n) {
            result[k] = nums2[j];
            j++;
            k++;
        }
        
        return result;
    }
    
    /**
     * @dev 合并多个有序数组
     * @param arrays 有序数组的数组
     * @return 合并后的有序数组
     * 
     * 使用分治法：两两合并
     */
    function mergeMultipleArrays(
        uint256[][] memory arrays
    ) public pure returns (uint256[] memory) {
        if (arrays.length == 0) {
            return new uint256[](0);
        }
        
        if (arrays.length == 1) {
            return arrays[0];
        }
        
        // 两两合并
        uint256[][] memory tempArrays = new uint256[][](arrays.length);
        for (uint256 i = 0; i < arrays.length; i++) {
            tempArrays[i] = arrays[i];
        }
        
        // 合并所有数组
        while (tempArrays.length > 1) {
            uint256 newLength = (tempArrays.length + 1) / 2;
            uint256[][] memory mergedArrays = new uint256[][](newLength);
            
            for (uint256 i = 0; i < newLength; i++) {
                if (i * 2 + 1 < tempArrays.length) {
                    // 合并两个数组
                    mergedArrays[i] = mergeSortedArrays(
                        tempArrays[i * 2],
                        tempArrays[i * 2 + 1]
                    );
                } else {
                    // 奇数个数组时，最后一个单独处理
                    mergedArrays[i] = tempArrays[i * 2];
                }
            }
            
            tempArrays = mergedArrays;
        }
        
        return tempArrays[0];
    }
    
    /**
     * @dev 验证数组是否已排序（升序）
     * @param arr 待验证的数组
     * @return 是否已排序
     */
    function isSorted(uint256[] memory arr) public pure returns (bool) {
        if (arr.length <= 1) {
            return true;
        }
        
        for (uint256 i = 0; i < arr.length - 1; i++) {
            if (arr[i] > arr[i + 1]) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * @dev 获取合并后的数组长度
     * @param nums1 第一个数组
     * @param nums2 第二个数组
     * @return 合并后的数组长度
     */
    function getMergedLength(
        uint256[] memory nums1,
        uint256[] memory nums2
    ) public pure returns (uint256) {
        return nums1.length + nums2.length;
    }
    
    /**
     * @dev 查找合并后数组中的最大值
     * @param nums1 第一个数组
     * @param nums2 第二个数组
     * @return 最大值
     */
    function getMaxValue(
        uint256[] memory nums1,
        uint256[] memory nums2
    ) public pure returns (uint256) {
        uint256 max1 = 0;
        uint256 max2 = 0;
        
        if (nums1.length > 0) {
            max1 = nums1[nums1.length - 1];
        }
        
        if (nums2.length > 0) {
            max2 = nums2[nums2.length - 1];
        }
        
        return max1 > max2 ? max1 : max2;
    }
    
    /**
     * @dev 查找合并后数组中的最小值
     * @param nums1 第一个数组
     * @param nums2 第二个数组
     * @return 最小值
     */
    function getMinValue(
        uint256[] memory nums1,
        uint256[] memory nums2
    ) public pure returns (uint256) {
        uint256 min1 = type(uint256).max;
        uint256 min2 = type(uint256).max;
        
        if (nums1.length > 0) {
            min1 = nums1[0];
        }
        
        if (nums2.length > 0) {
            min2 = nums2[0];
        }
        
        return min1 < min2 ? min1 : min2;
    }
}


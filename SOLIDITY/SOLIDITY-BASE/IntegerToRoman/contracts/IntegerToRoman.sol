// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title IntegerToRoman
 * @dev 将整数转换为罗马数字的合约
 * @notice 支持所有标准的整数到罗马数字转换，包括减法形式
 */
contract IntegerToRoman {
    
    /**
     * @dev 将整数转换为罗马数字
     * @param num 要转换的整数（范围: 1-3999）
     * @return 转换后的罗马数字字符串
     * 
     * 转换规则:
     * 1. 如果不是以4或9开头，选择最大符号，减去其值，递归处理
     * 2. 如果以4或9开头，使用减法形式: IV(4), IX(9), XL(40), XC(90), CD(400), CM(900)
     * 3. 只有10的幂次(I, X, C, M)可以连续出现最多3次
     */
    function intToRoman(uint256 num) public pure returns (string memory) {
        require(num > 0 && num <= 3999, "Number must be between 1 and 3999");
        
        string memory result = "";
        
        // 处理千位 (M)
        if (num >= 1000) {
            uint256 thousands = num / 1000;
            for (uint256 i = 0; i < thousands; i++) {
                result = string.concat(result, "M");
            }
            num = num % 1000;
        }
        
        // 处理百位 (C, CD, D, CM)
        if (num >= 100) {
            result = string.concat(result, _convertHundreds(num / 100));
            num = num % 100;
        }
        
        // 处理十位 (X, XL, L, XC)
        if (num >= 10) {
            result = string.concat(result, _convertTens(num / 10));
            num = num % 10;
        }
        
        // 处理个位 (I, IV, V, IX)
        if (num > 0) {
            result = string.concat(result, _convertOnes(num));
        }
        
        return result;
    }
    
    /**
     * @dev 转换百位数字 (100-999)
     * @param hundreds 百位数字 (1-9)
     * @return 对应的罗马数字字符串
     */
    function _convertHundreds(uint256 hundreds) private pure returns (string memory) {
        if (hundreds == 9) {
            return "CM";
        } else if (hundreds == 4) {
            return "CD";
        } else if (hundreds >= 5) {
            string memory result = "D";
            for (uint256 i = 5; i < hundreds; i++) {
                result = string.concat(result, "C");
            }
            return result;
        } else {
            string memory result = "";
            for (uint256 i = 0; i < hundreds; i++) {
                result = string.concat(result, "C");
            }
            return result;
        }
    }
    
    /**
     * @dev 转换十位数字 (10-99)
     * @param tens 十位数字 (1-9)
     * @return 对应的罗马数字字符串
     */
    function _convertTens(uint256 tens) private pure returns (string memory) {
        if (tens == 9) {
            return "XC";
        } else if (tens == 4) {
            return "XL";
        } else if (tens >= 5) {
            string memory result = "L";
            for (uint256 i = 5; i < tens; i++) {
                result = string.concat(result, "X");
            }
            return result;
        } else {
            string memory result = "";
            for (uint256 i = 0; i < tens; i++) {
                result = string.concat(result, "X");
            }
            return result;
        }
    }
    
    /**
     * @dev 转换个位数字 (1-9)
     * @param ones 个位数字 (1-9)
     * @return 对应的罗马数字字符串
     */
    function _convertOnes(uint256 ones) private pure returns (string memory) {
        if (ones == 9) {
            return "IX";
        } else if (ones == 4) {
            return "IV";
        } else if (ones >= 5) {
            string memory result = "V";
            for (uint256 i = 5; i < ones; i++) {
                result = string.concat(result, "I");
            }
            return result;
        } else {
            string memory result = "";
            for (uint256 i = 0; i < ones; i++) {
                result = string.concat(result, "I");
            }
            return result;
        }
    }
    
    /**
     * @dev 批量转换多个整数
     * @param nums 整数数组
     * @return 对应的罗马数字字符串数组
     */
    function batchConvert(uint256[] memory nums) public pure returns (string[] memory) {
        string[] memory results = new string[](nums.length);
        
        for (uint256 i = 0; i < nums.length; i++) {
            results[i] = intToRoman(nums[i]);
        }
        
        return results;
    }
    
    /**
     * @dev 验证罗马数字的有效性（通过转换再转换回来验证）
     * @param roman 罗马数字字符串
     * @return 是否匹配
     * @notice 此函数需要配合 RomanToInteger 合约使用，当前为占位符实现
     */
    function verifyConversion(string memory roman, uint256 /* expectedNum */) public pure returns (bool) {
        // 注意：这个函数需要配合 RomanToInteger 合约使用
        // 这里只是提供一个接口，实际验证需要在外部完成
        // 因为我们需要导入 RomanToInteger 合约，或者使用链下验证
        // 暂时使用 roman 参数以避免未使用参数警告
        bytes memory romanBytes = bytes(roman);
        return romanBytes.length > 0; // 占位符，实际实现需要导入 RomanToInteger
    }
    
    /**
     * @dev 获取可转换的最大值
     * @return 最大值 (3999)
     */
    function getMaxValue() public pure returns (uint256) {
        return 3999;
    }
    
    /**
     * @dev 获取可转换的最小值
     * @return 最小值 (1)
     */
    function getMinValue() public pure returns (uint256) {
        return 1;
    }
}


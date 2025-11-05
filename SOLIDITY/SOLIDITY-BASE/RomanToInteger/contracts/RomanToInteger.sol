// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title RomanToInteger
 * @dev 将罗马数字转换为整数的合约
 * @notice 支持所有标准罗马数字字符和特殊情况（减法规则）
 */
contract RomanToInteger {
    
    /**
     * @dev 将罗马数字转换为整数
     * @param s 罗马数字字符串
     * @return 转换后的整数值
     * 
     * 支持的字符: I, V, X, L, C, D, M
     * 特殊情况: IV(4), IX(9), XL(40), XC(90), CD(400), CM(900)
     */
    function romanToInt(string memory s) public pure returns (uint256) {
        bytes memory strBytes = bytes(s);
        uint256 length = strBytes.length;
        
        // 空字符串返回0
        if (length == 0) {
            return 0;
        }
        
        uint256 result = 0;
        
        // 从右到左遍历，或者从左到右检查下一个字符
        for (uint256 i = 0; i < length; i++) {
            uint256 currentValue = getRomanValue(strBytes[i]);
            
            // 如果不是最后一个字符，检查下一个字符
            if (i < length - 1) {
                uint256 nextValue = getRomanValue(strBytes[i + 1]);
                
                // 如果当前值小于下一个值，应用减法规则
                if (currentValue < nextValue) {
                    result += nextValue - currentValue;
                    i++; // 跳过下一个字符，因为已经处理了
                    continue;
                }
            }
            
            // 否则直接加上当前值
            result += currentValue;
        }
        
        return result;
    }
    
    /**
     * @dev 获取单个罗马数字字符对应的数值
     * @param c 罗马数字字符（bytes类型）
     * @return 对应的整数值
     */
    function getRomanValue(bytes1 c) private pure returns (uint256) {
        if (c == 0x49) { // 'I'
            return 1;
        } else if (c == 0x56) { // 'V'
            return 5;
        } else if (c == 0x58) { // 'X'
            return 10;
        } else if (c == 0x4C) { // 'L'
            return 50;
        } else if (c == 0x43) { // 'C'
            return 100;
        } else if (c == 0x44) { // 'D'
            return 500;
        } else if (c == 0x4D) { // 'M'
            return 1000;
        } else {
            revert("Invalid Roman numeral character");
        }
    }
    
    /**
     * @dev 验证字符串是否为有效的罗马数字
     * @param s 待验证的字符串
     * @return 是否为有效的罗马数字
     */
    function isValidRoman(string memory s) public pure returns (bool) {
        bytes memory strBytes = bytes(s);
        
        for (uint256 i = 0; i < strBytes.length; i++) {
            bytes1 c = strBytes[i];
            if (
                c != 0x49 && // 'I'
                c != 0x56 && // 'V'
                c != 0x58 && // 'X'
                c != 0x4C && // 'L'
                c != 0x43 && // 'C'
                c != 0x44 && // 'D'
                c != 0x4D    // 'M'
            ) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * @dev 批量转换多个罗马数字
     * @param romans 罗马数字字符串数组
     * @return 对应的整数值数组
     */
    function batchConvert(string[] memory romans) public pure returns (uint256[] memory) {
        uint256[] memory results = new uint256[](romans.length);
        
        for (uint256 i = 0; i < romans.length; i++) {
            results[i] = romanToInt(romans[i]);
        }
        
        return results;
    }
}


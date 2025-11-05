// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title StringReversal
 * @dev 一个用于反转字符串的合约
 * @notice 输入 "abcde"，输出 "edcba"
 */
contract StringReversal {
    
    /**
     * @dev 反转字符串
     * @param str 要反转的字符串
     * @return 反转后的字符串
     */
    function reverse(string memory str) public pure returns (string memory) {
        // 将字符串转换为 bytes 以便操作
        bytes memory strBytes = bytes(str);
        bytes memory reversed = new bytes(strBytes.length);
        
        // 反转字节数组
        for (uint256 i = 0; i < strBytes.length; i++) {
            reversed[i] = strBytes[strBytes.length - 1 - i];
        }
        
        // 将 bytes 转换回 string
        return string(reversed);
    }
    
    /**
     * @dev 反转字符串（使用 bytes 作为输入，更节省 gas）
     * @param strBytes 要反转的字符串的字节数组
     * @return 反转后的字符串
     */
    function reverseBytes(bytes memory strBytes) public pure returns (string memory) {
        bytes memory reversed = new bytes(strBytes.length);
        
        // 反转字节数组
        for (uint256 i = 0; i < strBytes.length; i++) {
            reversed[i] = strBytes[strBytes.length - 1 - i];
        }
        
        return string(reversed);
    }
    
    /**
     * @dev 验证反转功能（用于测试）
     * @param original 原始字符串
     * @param expected 期望的反转结果
     * @return 是否匹配
     */
    function verifyReversal(string memory original, string memory expected) 
        public 
        pure 
        returns (bool) 
    {
        string memory reversed = reverse(original);
        
        // 比较字符串需要使用 keccak256 哈希
        return keccak256(bytes(reversed)) == keccak256(bytes(expected));
    }
    
    /**
     * @dev 获取字符串长度（辅助函数）
     * @param str 字符串
     * @return 字符串长度
     */
    function getStringLength(string memory str) public pure returns (uint256) {
        return bytes(str).length;
    }
}


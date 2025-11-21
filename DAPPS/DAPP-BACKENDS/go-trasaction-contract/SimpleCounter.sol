// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SimpleCounter
 * @dev 一个简单的计数器合约
 */
contract SimpleCounter {
    uint256 private count;
    
    // 事件：计数器值改变
    event CountChanged(uint256 oldValue, uint256 newValue);
    
    /**
     * @dev 构造函数，初始化计数器为 0
     */
    constructor() {
        count = 0;
    }
    
    /**
     * @dev 增加计数器值
     * @return 新的计数器值
     */
    function increment() public returns (uint256) {
        uint256 oldValue = count;
        count += 1;
        emit CountChanged(oldValue, count);
        return count;
    }
    
    /**
     * @dev 减少计数器值
     * @return 新的计数器值
     */
    function decrement() public returns (uint256) {
        require(count > 0, "Counter cannot be negative");
        uint256 oldValue = count;
        count -= 1;
        emit CountChanged(oldValue, count);
        return count;
    }
    
    /**
     * @dev 获取当前计数器值
     * @return 当前计数器值
     */
    function getCount() public view returns (uint256) {
        return count;
    }
    
    /**
     * @dev 重置计数器为 0
     */
    function reset() public {
        uint256 oldValue = count;
        count = 0;
        emit CountChanged(oldValue, count);
    }
}
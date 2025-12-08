// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {console} from "forge-std/console.sol";

/**
 * @title Counter
 * @dev 一个简单的计数器合约示例
 */
contract Counter {
    uint256 public number;

    event NumberSet(uint256 indexed oldNumber, uint256 indexed newNumber);
    event NumberIncremented(uint256 indexed newNumber);
    event NumberDecremented(uint256 indexed newNumber);
    event NumberReset(uint256 indexed oldNumber);

    /**
     * @dev 设置数字
     * @param newNumber 新的数字值
     */
    function setNumber(uint256 newNumber) public {
        uint256 oldNumber = number;
        number = newNumber;
        emit NumberSet(oldNumber, newNumber);
        console.log("Number set to", number);
    }

    /**
     * @dev 增加数字
     */
    function increment() public {
        number++;
        emit NumberIncremented(number);
        console.log("Number incremented to", number);
    }

    /**
     * @dev 减少数字(需要确保不会下溢)
     */
    function decrement() public {
        require(number > 0, "Counter: decrement overflow");
        number--;
        emit NumberDecremented(number);
        console.log("Number decremented to", number);
    }

    /**
     * @dev 重置数字为 0
     */
    function reset() public {
        uint256 oldNumber = number;
        number = 0;
        emit NumberReset(oldNumber);
        console.log("Number reset to 0. Old number was", oldNumber);
    }

    /**
     * @dev 获取当前数字
     * @return 当前数字值
     */
    function getNumber() public view returns (uint256) {
        return number;
    }
}

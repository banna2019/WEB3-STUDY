// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

/**
 * @title CounterTest
 * @dev Counter 合约的测试套件
 */
contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
        console.log("Counter deployed at:", address(counter));
    }

    /**
     * @dev 测试设置数字
     */
    function test_SetNumber() public {
        counter.setNumber(42);
        assertEq(counter.number(), 42);
        assertEq(counter.getNumber(), 42);
    }

    /**
     * @dev 测试增加数字
     */
    function test_Increment() public {
        assertEq(counter.number(), 0);
        counter.increment();
        assertEq(counter.number(), 1);
        counter.increment();
        assertEq(counter.number(), 2);
    }

    /**
     * @dev 测试减少数字
     */
    function test_Decrement() public {
        counter.setNumber(5);
        counter.decrement();
        assertEq(counter.number(), 4);
        counter.decrement();
        assertEq(counter.number(), 3);
    }

    /**
     * @dev 测试减少数字下溢保护
     */
    function test_DecrementUnderflow() public {
        assertEq(counter.number(), 0);
        vm.expectRevert("Counter: decrement overflow");
        counter.decrement();
    }

    /**
     * @dev 测试重置数字
     */
    function test_Reset() public {
        counter.setNumber(100);
        assertEq(counter.number(), 100);
        counter.reset();
        assertEq(counter.number(), 0);
    }

    /**
     * @dev 测试获取数字函数
     */
    function test_GetNumber() public view {
        uint256 currentNumber = counter.getNumber();
        assertEq(currentNumber, counter.number());
    }

    /**
     * @dev 模糊测试：设置任意数字
     */
    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }

    /**
     * @dev 模糊测试：增加操作
     */
    function testFuzz_Increment(uint256 initialValue) public {
        vm.assume(initialValue < type(uint256).max);
        counter.setNumber(initialValue);
        counter.increment();
        assertEq(counter.number(), initialValue + 1);
    }

    /**
     * @dev 模糊测试：减少操作
     */
    function testFuzz_Decrement(uint256 initialValue) public {
        vm.assume(initialValue > 0);
        counter.setNumber(initialValue);
        counter.decrement();
        assertEq(counter.number(), initialValue - 1);
    }

    /**
     * @dev 测试事件发出
     */
    function test_Events() public {
        // 测试 NumberSet 事件
        vm.expectEmit(true, true, false, true);
        emit Counter.NumberSet(0, 42);
        counter.setNumber(42);

        // 测试 NumberIncremented 事件
        vm.expectEmit(true, false, false, true);
        emit Counter.NumberIncremented(43);
        counter.increment();

        // 测试 NumberDecremented 事件
        vm.expectEmit(true, false, false, true);
        emit Counter.NumberDecremented(42);
        counter.decrement();

        // 测试 NumberReset 事件
        vm.expectEmit(true, false, false, true);
        emit Counter.NumberReset(42);
        counter.reset();
    }
}

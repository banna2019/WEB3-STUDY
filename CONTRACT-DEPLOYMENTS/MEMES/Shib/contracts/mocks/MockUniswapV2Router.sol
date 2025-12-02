// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IUniswapV2Router02.sol";

/**
 * @title MockUniswapV2Router
 * @notice Mock Uniswap V2 Router合约，用于测试
 * @dev 模拟Uniswap V2 Router的功能，简化测试流程
 */
contract MockUniswapV2Router is IUniswapV2Router02 {
    address public immutable override factory;
    address public immutable override WETH;
    address public mockPair;
    
    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }
    
    function setMockPair(address _mockPair) external {
        mockPair = _mockPair;
    }
    
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address /* to */,
        uint256 deadline
    ) external payable override returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        require(amountTokenDesired >= amountTokenMin, "Router: INSUFFICIENT_TOKEN_AMOUNT");
        require(msg.value >= amountETHMin, "Router: INSUFFICIENT_ETH_AMOUNT");
        
        // 从合约转账代币到Router
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);
        
        amountToken = amountTokenDesired;
        amountETH = msg.value;
        
        // 计算LP代币数量（简化计算）
        liquidity = sqrt(amountToken * amountETH);
        
        // 将代币和ETH发送到Pair地址（模拟）
        if (mockPair != address(0)) {
            IERC20(token).transfer(mockPair, amountToken);
            payable(mockPair).transfer(amountETH);
        }
    }
    
    function removeLiquidityETH(
        address token,
        uint256 /* liquidity */,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external override returns (uint256 amountToken, uint256 amountETH) {
        require(deadline >= block.timestamp, "Router: EXPIRED");
        
        // 简化实现：返回最小金额
        amountToken = amountTokenMin;
        amountETH = amountETHMin;
        
        // 转账代币和ETH给接收者
        IERC20(token).transfer(to, amountToken);
        payable(to).transfer(amountETH);
    }
    
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}


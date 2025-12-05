// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IUniswapV2Router02
 * @notice Uniswap V2 Router 02接口
 * @dev 用于与Uniswap V2 Router交互，实现添加和移除流动性功能
 */
interface IUniswapV2Router02 {
    /**
     * @notice 获取Factory地址
     * @return Factory合约地址
     */
    function factory() external view returns (address);

    /**
     * @notice 获取WETH地址
     * @return WETH代币地址
     */
    function WETH() external view returns (address);

    /**
     * @notice 添加流动性（代币和ETH）
     * @param token 代币地址
     * @param amountTokenDesired 期望的代币数量
     * @param amountTokenMin 最小代币数量（滑点保护）
     * @param amountETHMin 最小ETH数量（滑点保护）
     * @param to LP代币接收地址
     * @param deadline 交易截止时间（Unix时间戳）
     * @return amountToken 实际添加的代币数量
     * @return amountETH 实际添加的ETH数量
     * @return liquidity LP代币数量
     */
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        );

    /**
     * @notice 移除流动性（代币和ETH）
     * @param token 代币地址
     * @param liquidity LP代币数量
     * @param amountTokenMin 最小代币数量（滑点保护）
     * @param amountETHMin 最小ETH数量（滑点保护）
     * @param to 代币和ETH接收地址
     * @param deadline 交易截止时间（Unix时间戳）
     * @return amountToken 实际移除的代币数量
     * @return amountETH 实际移除的ETH数量
     */
    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH);
}


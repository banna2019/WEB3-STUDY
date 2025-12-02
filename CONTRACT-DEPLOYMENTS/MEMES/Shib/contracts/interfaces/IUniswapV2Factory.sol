// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IUniswapV2Factory
 * @notice Uniswap V2 Factory接口
 * @dev 用于创建和获取交易对
 */
interface IUniswapV2Factory {
    /**
     * @notice 获取交易对地址
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     * @return pair 交易对地址（如果不存在则返回address(0)）
     */
    function getPair(address tokenA, address tokenB) external view returns (address pair);

    /**
     * @notice 创建交易对
     * @param tokenA 代币A地址
     * @param tokenB 代币B地址
     * @return pair 新创建的交易对地址
     */
    function createPair(address tokenA, address tokenB) external returns (address pair);
}


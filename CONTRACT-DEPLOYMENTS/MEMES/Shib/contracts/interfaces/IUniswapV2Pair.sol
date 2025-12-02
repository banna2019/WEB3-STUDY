// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IUniswapV2Pair
 * @notice Uniswap V2 Pair接口
 * @dev 用于与交易对交互，获取储备量等信息
 */
interface IUniswapV2Pair {
    /**
     * @notice 获取代币0地址
     * @return token0地址
     */
    function token0() external view returns (address);

    /**
     * @notice 获取代币1地址
     * @return token1地址
     */
    function token1() external view returns (address);

    /**
     * @notice 获取储备量
     * @return reserve0 代币0的储备量
     * @return reserve1 代币1的储备量
     * @return blockTimestampLast 最后更新时间戳
     */
    function getReserves()
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        );

    /**
     * @notice 转账代币（ERC20标准函数）
     * @param to 接收地址
     * @param amount 转账数量
     * @return 是否成功
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @notice 授权代币（ERC20标准函数）
     * @param spender 被授权地址
     * @param amount 授权数量
     * @return 是否成功
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @notice 代理转账（ERC20标准函数）
     * @param from 发送地址
     * @param to 接收地址
     * @param amount 转账数量
     * @return 是否成功
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}


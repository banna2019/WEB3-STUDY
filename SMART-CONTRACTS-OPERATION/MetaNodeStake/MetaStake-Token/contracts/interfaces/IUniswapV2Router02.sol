// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IUniswapV2Router02
 * @dev Uniswap V2 Router 02接口
 * @notice 用于与Uniswap V2 Router交互，实现代币交换功能
 */
interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external view returns (address);

    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] calldata path)
        external
        view
        returns (uint[] memory amounts);

    function getAmountsIn(uint amountOut, address[] calldata path)
        external
        view
        returns (uint[] memory amounts);
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockUniswapRouter
 * @dev Mock Uniswap V2 Router用于测试
 */
contract MockUniswapRouter is IUniswapV2Router02 {
    address private immutable _WETH;
    
    // 交换比例映射：tokenIn => tokenOut => 比例（1 tokenIn = rate tokenOut）
    mapping(address => mapping(address => uint256)) public swapRates;

    constructor(address __WETH) {
        _WETH = __WETH;
    }

    function factory() external pure override returns (address) {
        return address(0);
    }

    function WETH() external view override returns (address) {
        return _WETH;
    }

    function setSwapRate(address tokenIn, address tokenOut, uint256 rate) external {
        swapRates[tokenIn][tokenOut] = rate;
    }

    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
        require(deadline >= block.timestamp, "EXPIRED");
        require(path.length == 2, "Invalid path");
        require(path[1] == _WETH, "Invalid path");

        uint256 rate = swapRates[path[0]][path[1]];
        require(rate > 0, "Rate not set");
        
        uint256 amountOut = (amountIn * rate) / 1e18;
        require(amountOut >= amountOutMin, "Insufficient output amount");

        // 从调用者转移输入代币
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        // 发送ETH（模拟WETH转换为ETH）
        (bool success, ) = payable(to).call{value: amountOut}("");
        require(success, "ETH transfer failed");

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external override returns (uint[] memory amounts) {
        require(deadline >= block.timestamp, "EXPIRED");
        require(path.length >= 2, "Invalid path");

        // 从调用者转移输入代币
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        uint256 currentAmount = amountIn;
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        // 逐步交换
        for (uint256 i = 0; i < path.length - 1; i++) {
            uint256 rate = swapRates[path[i]][path[i + 1]];
            require(rate > 0, "Rate not set");
            
            uint256 amountOut = (currentAmount * rate) / 1e18;
            amounts[i + 1] = amountOut;

            // 如果是最后一步，发送给接收者
            if (i == path.length - 2) {
                require(amountOut >= amountOutMin, "Insufficient output amount");
                // 确保合约有足够的代币余额
                uint256 balance = IERC20(path[i + 1]).balanceOf(address(this));
                require(balance >= amountOut, "Insufficient token balance in router");
                IERC20(path[i + 1]).transfer(to, amountOut);
            } else {
                // 中间步骤：需要确保中间代币有足够余额
                uint256 balance = IERC20(path[i + 1]).balanceOf(address(this));
                require(balance >= amountOut, "Insufficient intermediate token balance");
            }
            currentAmount = amountOut;
        }
    }

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable override returns (uint[] memory amounts) {
        require(deadline >= block.timestamp, "EXPIRED");
        require(path.length >= 2, "Invalid path");
        require(path[0] == _WETH, "Invalid path");

        uint256 amountIn = msg.value;
        uint256 currentAmount = amountIn;
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        // 逐步交换
        for (uint256 i = 0; i < path.length - 1; i++) {
            uint256 rate = swapRates[path[i]][path[i + 1]];
            require(rate > 0, "Rate not set");
            
            uint256 amountOut = (currentAmount * rate) / 1e18;
            amounts[i + 1] = amountOut;
            currentAmount = amountOut;

            // 如果是最后一步，发送给接收者
            if (i == path.length - 2) {
                require(amountOut >= amountOutMin, "Insufficient output amount");
                uint256 balance = IERC20(path[i + 1]).balanceOf(address(this));
                require(balance >= amountOut, "Insufficient token balance in router");
                IERC20(path[i + 1]).transfer(to, amountOut);
            } else {
                // 中间步骤：需要确保中间代币有足够余额
                uint256 balance = IERC20(path[i + 1]).balanceOf(address(this));
                require(balance >= amountOut, "Insufficient intermediate token balance");
            }
        }
    }

    function getAmountsOut(uint amountIn, address[] calldata path)
        external
        view
        override
        returns (uint[] memory amounts)
    {
        require(path.length >= 2, "Invalid path");

        uint256 currentAmount = amountIn;
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            uint256 rate = swapRates[path[i]][path[i + 1]];
            if (rate == 0) {
                // 如果未设置比例，返回0
                amounts[i + 1] = 0;
                return amounts;
            }
            uint256 amountOut = (currentAmount * rate) / 1e18;
            amounts[i + 1] = amountOut;
            currentAmount = amountOut;
        }
    }

    function getAmountsIn(uint amountOut, address[] calldata path)
        external
        view
        override
        returns (uint[] memory amounts)
    {
        require(path.length >= 2, "Invalid path");

        uint256 currentAmount = amountOut;
        amounts = new uint256[](path.length);
        amounts[path.length - 1] = amountOut;

        // 反向计算
        for (uint256 i = path.length - 1; i > 0; i--) {
            uint256 rate = swapRates[path[i - 1]][path[i]];
            if (rate == 0) {
                amounts[0] = 0;
                return amounts;
            }
            uint256 amountIn = (currentAmount * 1e18) / rate;
            amounts[i - 1] = amountIn;
            currentAmount = amountIn;
        }
    }

    // 接收ETH
    receive() external payable {}
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title PriceOracle
 * @dev 使用 Chainlink 预言机获取价格信息
 * @notice 支持多种加密货币、DeFi代币、稳定币和传统资产的价格查询
 */
contract PriceOracle {
    // Chainlink ETH/USD 价格源
    AggregatorV3Interface internal ethUsdPriceFeed;
    
    // Chainlink ERC20/USD 价格源映射
    mapping(address => AggregatorV3Interface) public erc20UsdPriceFeeds;
    
    // 预定义的价格源类型枚举
    enum PriceFeedType {
        ETH_USD,
        BTC_USD,
        BNB_USD,
        MATIC_USD,
        ARB_USD,
        AAVE_USD,
        UNI_USD,
        LINK_USD,
        CRV_USD,
        MKR_USD,
        USDC_USD,
        USDT_USD,
        DAI_USD,
        FRAX_USD,
        XAU_USD,
        XAG_USD,
        EUR_USD,
        JPY_USD
    }
    
    // 事件：价格源更新
    event PriceFeedUpdated(address indexed token, address indexed priceFeed);
    event PriceFeedTypeUpdated(PriceFeedType feedType, address indexed priceFeed);
    
    /**
     * @dev 构造函数
     * @param _ethUsdPriceFeed ETH/USD 价格源地址
     */
    constructor(address _ethUsdPriceFeed) {
        require(_ethUsdPriceFeed != address(0), "Invalid price feed address");
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
    }
    
    /**
     * @dev 添加 ERC20/USD 价格源
     * @param token ERC20 代币地址
     * @param priceFeed 价格源地址
     */
    function setERC20PriceFeed(address token, address priceFeed) public {
        require(token != address(0), "Invalid token address");
        require(priceFeed != address(0), "Invalid price feed address");
        erc20UsdPriceFeeds[token] = AggregatorV3Interface(priceFeed);
        emit PriceFeedUpdated(token, priceFeed);
    }
    
    /**
     * @dev 批量设置价格源（用于初始化多个价格源）
     * @param tokens 代币地址数组
     * @param priceFeeds 价格源地址数组
     */
    function setERC20PriceFeedsBatch(
        address[] memory tokens,
        address[] memory priceFeeds
    ) public {
        require(tokens.length == priceFeeds.length, "Arrays length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            setERC20PriceFeed(tokens[i], priceFeeds[i]);
        }
    }
    
    /**
     * @dev 获取 ETH/USD 价格
     * @return price ETH 的美元价格（带 8 位小数）
     * @return decimals 价格精度（通常为 8）
     */
    function getETHPrice() public view returns (int256 price, uint8 decimals) {
        (, int256 price_, , , ) = ethUsdPriceFeed.latestRoundData();
        uint8 decimals_ = ethUsdPriceFeed.decimals();
        return (price_, decimals_);
    }
    
    /**
     * @dev 获取 ERC20/USD 价格
     * @param token ERC20 代币地址
     * @return price ERC20 代币的美元价格（带 8 位小数）
     * @return decimals 价格精度（通常为 8）
     */
    function getERC20Price(address token) public view returns (int256 price, uint8 decimals) {
        AggregatorV3Interface priceFeed = erc20UsdPriceFeeds[token];
        require(address(priceFeed) != address(0), "Price feed not set for token");
        
        (, int256 price_, , , ) = priceFeed.latestRoundData();
        uint8 decimals_ = priceFeed.decimals();
        return (price_, decimals_);
    }
    
    /**
     * @dev 将 ETH 金额转换为美元
     * @param ethAmount ETH 数量（以 wei 为单位）
     * @return usdAmount 美元金额（带 8 位小数）
     */
    function convertETHToUSD(uint256 ethAmount) public view returns (uint256 usdAmount) {
        (int256 price, uint8 decimals) = getETHPrice();
        require(price > 0, "Invalid price");
        
        // 计算：ethAmount * price / 10^decimals
        // 注意：ethAmount 是 wei（18 位小数），price 是 8 位小数
        // 结果需要调整精度
        return (ethAmount * uint256(price)) / (10 ** decimals);
    }
    
    /**
     * @dev 将 ERC20 代币金额转换为美元
     * @param token ERC20 代币地址
     * @param tokenAmount 代币数量（以代币的最小单位为单位）
     * @param tokenDecimals 代币精度（通常为 18）
     * @return usdAmount 美元金额（带 8 位小数）
     */
    function convertERC20ToUSD(
        address token,
        uint256 tokenAmount,
        uint8 tokenDecimals
    ) public view returns (uint256 usdAmount) {
        (int256 price, uint8 priceDecimals) = getERC20Price(token);
        require(price > 0, "Invalid price");
        
        // 计算：tokenAmount * price / 10^(priceDecimals + tokenDecimals - 18)
        // 简化：假设 tokenDecimals = 18，priceDecimals = 8
        // 结果 = tokenAmount * price / 10^8
        if (tokenDecimals >= priceDecimals) {
            return (tokenAmount * uint256(price)) / (10 ** priceDecimals);
        } else {
            return (tokenAmount * uint256(price)) / (10 ** tokenDecimals);
        }
    }
    
    /**
     * @dev 比较两个出价（ETH 和 ERC20），返回更高的出价
     * @param ethBid ETH 出价（以 wei 为单位）
     * @param token ERC20 代币地址（如果为 address(0)，则忽略 tokenBid）
     * @param tokenBid ERC20 代币出价
     * @param tokenDecimals ERC20 代币精度
     * @return isETHHigher 如果 ETH 出价更高，返回 true
     * @return higherBidUSD 更高的出价对应的美元金额
     */
    function compareBids(
        uint256 ethBid,
        address token,
        uint256 tokenBid,
        uint8 tokenDecimals
    ) public view returns (bool isETHHigher, uint256 higherBidUSD) {
        uint256 ethBidUSD = convertETHToUSD(ethBid);
        
        uint256 tokenBidUSD = 0;
        if (token != address(0)) {
            tokenBidUSD = convertERC20ToUSD(token, tokenBid, tokenDecimals);
        }
        
        if (ethBidUSD >= tokenBidUSD) {
            return (true, ethBidUSD);
        } else {
            return (false, tokenBidUSD);
        }
    }
    
    /**
     * @dev 检查价格源是否已设置
     * @param token 代币地址
     * @return 是否已设置价格源
     */
    function hasPriceFeed(address token) public view returns (bool) {
        return address(erc20UsdPriceFeeds[token]) != address(0);
    }
}

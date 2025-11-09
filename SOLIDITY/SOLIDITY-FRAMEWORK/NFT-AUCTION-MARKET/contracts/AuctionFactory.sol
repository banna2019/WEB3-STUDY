// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Auction.sol";

/**
 * @title AuctionFactory
 * @dev 工厂合约，用于创建和管理拍卖实例（类似 Uniswap V2 工厂模式）
 */
contract AuctionFactory {
    // 所有创建的拍卖地址
    address[] public auctions;
    
    // 拍卖地址到拍卖 ID 的映射
    mapping(address => uint256) public auctionIndex;
    
    // 用户创建的拍卖列表
    mapping(address => address[]) public userAuctions;
    
    // 事件
    event AuctionCreated(
        address indexed auction,
        address indexed creator,
        uint256 indexed auctionId
    );
    
    /**
     * @dev 创建新的拍卖合约
     * @param priceOracle 价格预言机地址
     * @param feeRate 手续费率（基点）
     * @param feeRecipient 手续费接收地址
     * @return auctionAddress 新创建的拍卖合约地址
     */
    function createAuction(
        address priceOracle,
        uint256 feeRate,
        address feeRecipient
    ) external returns (address auctionAddress) {
        // 部署新的拍卖合约
        Auction newAuction = new Auction(priceOracle, feeRate, feeRecipient);
        auctionAddress = address(newAuction);
        
        // 记录拍卖
        uint256 index = auctions.length;
        auctions.push(auctionAddress);
        auctionIndex[auctionAddress] = index;
        userAuctions[msg.sender].push(auctionAddress);
        
        emit AuctionCreated(auctionAddress, msg.sender, index);
        
        return auctionAddress;
    }
    
    /**
     * @dev 获取所有拍卖数量
     * @return 拍卖总数
     */
    function getAuctionsCount() external view returns (uint256) {
        return auctions.length;
    }
    
    /**
     * @dev 获取指定索引的拍卖地址
     * @param index 索引
     * @return 拍卖地址
     */
    function getAuction(uint256 index) external view returns (address) {
        require(index < auctions.length, "Index out of bounds");
        return auctions[index];
    }
    
    /**
     * @dev 获取用户创建的所有拍卖
     * @param user 用户地址
     * @return 用户创建的拍卖地址数组
     */
    function getUserAuctions(address user) external view returns (address[] memory) {
        return userAuctions[user];
    }
    
    /**
     * @dev 获取用户创建的拍卖数量
     * @param user 用户地址
     * @return 用户创建的拍卖数量
     */
    function getUserAuctionsCount(address user) external view returns (uint256) {
        return userAuctions[user].length;
    }
}


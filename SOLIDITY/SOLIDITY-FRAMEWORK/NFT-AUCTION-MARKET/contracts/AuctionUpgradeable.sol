// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./PriceOracle.sol";

/**
 * @title AuctionUpgradeable
 * @dev 可升级的 NFT 拍卖合约（UUPS 代理模式），支持 ERC20 和以太坊出价
 */
contract AuctionUpgradeable is UUPSUpgradeable, OwnableUpgradeable, IERC721Receiver {
    using SafeERC20 for IERC20;
    
    // 拍卖状态
    enum AuctionStatus {
        Active,    // 进行中
        Ended,      // 已结束
        Cancelled   // 已取消
    }
    
    // 出价结构
    struct Bid {
        address bidder;         // 出价者
        uint256 amount;          // 出价金额
        address token;           // 出价代币地址（address(0) 表示 ETH）
        uint256 usdValue;        // 美元价值
        uint256 timestamp;       // 出价时间
    }
    
    // 拍卖信息
    struct AuctionInfo {
        address seller;          // 卖家
        address nftContract;     // NFT 合约地址
        uint256 tokenId;         // NFT Token ID
        uint256 startTime;       // 开始时间
        uint256 endTime;         // 结束时间
        uint256 reservePrice;    // 底价（以 wei 为单位）
        address reserveToken;    // 底价代币（address(0) 表示 ETH）
        AuctionStatus status;    // 拍卖状态
        Bid highestBid;          // 最高出价
        address[] bidders;       // 所有出价者列表
        mapping(address => Bid) bids; // 每个地址的出价
    }
    
    // 拍卖映射
    mapping(uint256 => AuctionInfo) public auctions;
    uint256 public auctionCount;
    
    // 价格预言机
    PriceOracle public priceOracle;
    
    // 手续费率（基点，10000 = 100%）
    uint256 public feeRate; // 例如：250 = 2.5%
    address public feeRecipient;
    
    // 动态手续费率映射（拍卖 ID => 手续费率）
    mapping(uint256 => uint256) public dynamicFeeRates;
    
    // 版本号
    uint256 public version;
    
    // 事件
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 startTime,
        uint256 endTime,
        uint256 reservePrice
    );
    
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        address token,
        uint256 usdValue
    );
    
    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 amount,
        address token
    );
    
    event AuctionCancelled(uint256 indexed auctionId);
    
    event DynamicFeeUpdated(uint256 indexed auctionId, uint256 newFeeRate);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev 初始化函数（UUPS 代理模式）
     * @param _priceOracle 价格预言机地址
     * @param _feeRate 手续费率（基点）
     * @param _feeRecipient 手续费接收地址
     */
    function initialize(
        address _priceOracle,
        uint256 _feeRate,
        address _feeRecipient
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_feeRate <= 10000, "Fee rate too high");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        priceOracle = PriceOracle(_priceOracle);
        feeRate = _feeRate;
        feeRecipient = _feeRecipient;
        version = 1;
    }
    
    /**
     * @dev 创建拍卖
     * @param nftContract NFT 合约地址
     * @param tokenId NFT Token ID
     * @param duration 拍卖持续时间（秒）
     * @param reservePrice 底价（以 wei 为单位）
     * @param reserveToken 底价代币（address(0) 表示 ETH）
     * @return auctionId 拍卖 ID
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 duration,
        uint256 reservePrice,
        address reserveToken
    ) external returns (uint256) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(duration > 0, "Duration must be greater than 0");
        
        // 检查 NFT 所有权
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)), "Not approved");
        
        // 转移 NFT 到合约
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        
        uint256 auctionId = auctionCount++;
        AuctionInfo storage auction = auctions[auctionId];
        
        auction.seller = msg.sender;
        auction.nftContract = nftContract;
        auction.tokenId = tokenId;
        auction.startTime = block.timestamp;
        auction.endTime = block.timestamp + duration;
        auction.reservePrice = reservePrice;
        auction.reserveToken = reserveToken;
        auction.status = AuctionStatus.Active;
        
        emit AuctionCreated(
            auctionId,
            msg.sender,
            nftContract,
            tokenId,
            auction.startTime,
            auction.endTime,
            reservePrice
        );
        
        return auctionId;
    }
    
    /**
     * @dev 使用 ETH 出价
     * @param auctionId 拍卖 ID
     */
    function bidWithETH(uint256 auctionId) external payable {
        require(msg.value > 0, "Bid amount must be greater than 0");
        _placeBid(auctionId, msg.value, address(0));
    }
    
    /**
     * @dev 使用 ERC20 代币出价
     * @param auctionId 拍卖 ID
     * @param token ERC20 代币地址
     * @param amount 出价金额
     */
    function bidWithERC20(
        uint256 auctionId,
        address token,
        uint256 amount
    ) external {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Bid amount must be greater than 0");
        
        // 转移代币到合约
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        _placeBid(auctionId, amount, token);
    }
    
    /**
     * @dev 内部函数：处理出价逻辑
     * @param auctionId 拍卖 ID
     * @param amount 出价金额
     * @param token 代币地址（address(0) 表示 ETH）
     */
    function _placeBid(
        uint256 auctionId,
        uint256 amount,
        address token
    ) internal {
        AuctionInfo storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp >= auction.startTime, "Auction not started");
        require(block.timestamp < auction.endTime, "Auction ended");
        
        // 获取美元价值
        uint256 usdValue;
        if (token == address(0)) {
            usdValue = priceOracle.convertETHToUSD(amount);
        } else {
            // 假设 ERC20 代币精度为 18（可以根据实际情况调整）
            usdValue = priceOracle.convertERC20ToUSD(token, amount, 18);
        }
        
        // 检查是否超过当前最高出价
        require(
            usdValue > auction.highestBid.usdValue,
            "Bid must be higher than current highest bid"
        );
        
        // 检查是否满足底价
        uint256 reserveUSD;
        if (auction.reserveToken == address(0)) {
            reserveUSD = priceOracle.convertETHToUSD(auction.reservePrice);
        } else {
            reserveUSD = priceOracle.convertERC20ToUSD(auction.reserveToken, auction.reservePrice, 18);
        }
        require(usdValue >= reserveUSD, "Bid below reserve price");
        
        // 退还之前的出价
        if (auction.highestBid.bidder != address(0)) {
            _refundBid(auction.highestBid);
        }
        
        // 记录新出价
        Bid memory newBid = Bid({
            bidder: msg.sender,
            amount: amount,
            token: token,
            usdValue: usdValue,
            timestamp: block.timestamp
        });
        
        auction.highestBid = newBid;
        auction.bids[msg.sender] = newBid;
        
        // 添加到出价者列表（如果第一次出价）
        bool isNewBidder = true;
        for (uint256 i = 0; i < auction.bidders.length; i++) {
            if (auction.bidders[i] == msg.sender) {
                isNewBidder = false;
                break;
            }
        }
        if (isNewBidder) {
            auction.bidders.push(msg.sender);
        }
        
        emit BidPlaced(auctionId, msg.sender, amount, token, usdValue);
    }
    
    /**
     * @dev 退还出价
     * @param bid 出价信息
     */
    function _refundBid(Bid memory bid) internal {
        if (bid.token == address(0)) {
            // 退还 ETH
            (bool success, ) = payable(bid.bidder).call{value: bid.amount}("");
            require(success, "ETH refund failed");
        } else {
            // 退还 ERC20
            IERC20(bid.token).safeTransfer(bid.bidder, bid.amount);
        }
    }
    
    /**
     * @dev 结束拍卖
     * @param auctionId 拍卖 ID
     */
    function endAuction(uint256 auctionId) external {
        AuctionInfo storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(
            block.timestamp >= auction.endTime || auction.highestBid.bidder != address(0),
            "Cannot end auction"
        );
        
        auction.status = AuctionStatus.Ended;
        
        // 如果有出价者，转移 NFT 和资金
        if (auction.highestBid.bidder != address(0)) {
            // 转移 NFT 给获胜者
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.highestBid.bidder,
                auction.tokenId
            );
            
            // 计算手续费（支持动态手续费）
            uint256 currentFeeRate = dynamicFeeRates[auctionId] > 0 
                ? dynamicFeeRates[auctionId] 
                : feeRate;
            uint256 fee = (auction.highestBid.amount * currentFeeRate) / 10000;
            uint256 sellerAmount = auction.highestBid.amount - fee;
            
            // 转移资金给卖家
            if (auction.highestBid.token == address(0)) {
                // ETH
                (bool success1, ) = payable(auction.seller).call{value: sellerAmount}("");
                require(success1, "ETH transfer to seller failed");
                
                if (fee > 0) {
                    (bool success2, ) = payable(feeRecipient).call{value: fee}("");
                    require(success2, "ETH fee transfer failed");
                }
            } else {
                // ERC20
                IERC20(auction.highestBid.token).safeTransfer(auction.seller, sellerAmount);
                
                if (fee > 0) {
                    IERC20(auction.highestBid.token).safeTransfer(feeRecipient, fee);
                }
            }
            
            emit AuctionEnded(
                auctionId,
                auction.highestBid.bidder,
                auction.highestBid.amount,
                auction.highestBid.token
            );
        } else {
            // 没有出价者，退还 NFT 给卖家
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );
        }
        
        // 退还其他出价者的资金
        for (uint256 i = 0; i < auction.bidders.length; i++) {
            address bidder = auction.bidders[i];
            if (bidder != auction.highestBid.bidder) {
                Bid memory bid = auction.bids[bidder];
                if (bid.bidder != address(0)) {
                    _refundBid(bid);
                }
            }
        }
    }
    
    /**
     * @dev 取消拍卖（仅卖家）
     * @param auctionId 拍卖 ID
     */
    function cancelAuction(uint256 auctionId) external {
        AuctionInfo storage auction = auctions[auctionId];
        
        require(auction.seller == msg.sender, "Not seller");
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(auction.highestBid.bidder == address(0), "Cannot cancel with bids");
        
        auction.status = AuctionStatus.Cancelled;
        
        // 退还 NFT 给卖家
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );
        
        emit AuctionCancelled(auctionId);
    }
    
    /**
     * @dev 设置动态手续费率（仅所有者）
     * @param auctionId 拍卖 ID
     * @param newFeeRate 新的手续费率（基点）
     */
    function setDynamicFeeRate(uint256 auctionId, uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 10000, "Fee rate too high");
        dynamicFeeRates[auctionId] = newFeeRate;
        emit DynamicFeeUpdated(auctionId, newFeeRate);
    }
    
    /**
     * @dev 查询拍卖信息
     * @param auctionId 拍卖 ID
     * @return seller 卖家地址
     * @return nftContract NFT 合约地址
     * @return tokenId NFT Token ID
     * @return startTime 开始时间
     * @return endTime 结束时间
     * @return reservePrice 底价
     * @return reserveToken 底价代币
     * @return status 拍卖状态
     * @return highestBidder 最高出价者
     * @return highestBidAmount 最高出价金额
     * @return highestBidToken 最高出价代币
     * @return highestBidUSD 最高出价美元价值
     */
    function getAuctionInfo(uint256 auctionId)
        external
        view
        returns (
            address seller,
            address nftContract,
            uint256 tokenId,
            uint256 startTime,
            uint256 endTime,
            uint256 reservePrice,
            address reserveToken,
            AuctionStatus status,
            address highestBidder,
            uint256 highestBidAmount,
            address highestBidToken,
            uint256 highestBidUSD
        )
    {
        AuctionInfo storage auction = auctions[auctionId];
        return (
            auction.seller,
            auction.nftContract,
            auction.tokenId,
            auction.startTime,
            auction.endTime,
            auction.reservePrice,
            auction.reserveToken,
            auction.status,
            auction.highestBid.bidder,
            auction.highestBid.amount,
            auction.highestBid.token,
            auction.highestBid.usdValue
        );
    }
    
    /**
     * @dev 查询出价信息
     * @param auctionId 拍卖 ID
     * @param bidder 出价者地址
     * @return bidder_ 出价者地址
     * @return amount 出价金额
     * @return token 代币地址
     * @return usdValue 美元价值
     * @return timestamp 出价时间
     */
    function getBidInfo(uint256 auctionId, address bidder)
        external
        view
        returns (
            address bidder_,
            uint256 amount,
            address token,
            uint256 usdValue,
            uint256 timestamp
        )
    {
        Bid memory bid = auctions[auctionId].bids[bidder];
        return (bid.bidder, bid.amount, bid.token, bid.usdValue, bid.timestamp);
    }
    
    /**
     * @dev 实现 IERC721Receiver 接口，允许合约接收 NFT
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
    
    /**
     * @dev UUPS 升级授权（仅所有者）
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    
    /**
     * @dev 接收 ETH
     */
    receive() external payable {
        revert("Use bidWithETH function");
    }
}


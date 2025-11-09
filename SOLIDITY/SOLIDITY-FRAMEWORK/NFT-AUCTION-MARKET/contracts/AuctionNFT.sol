// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuctionNFT
 * @dev ERC721 NFT 合约，支持铸造和转移，用于拍卖市场
 */
contract AuctionNFT is ERC721, ERC721URIStorage, Ownable {
    // Token ID 计数器
    uint256 private _nextTokenId = 1;
    
    // 事件：NFT 铸造
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    
    /**
     * @dev 构造函数
     * @param name NFT 集合名称
     * @param symbol NFT 集合符号
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        // Token ID 从 1 开始
    }
    
    /**
     * @dev 铸造 NFT（仅所有者）
     * @param to 接收 NFT 的地址
     * @param uri NFT 元数据的 URI
     * @return tokenId 返回新铸造的 token ID
     */
    function mint(address to, string memory uri) public onlyOwner returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(uri).length > 0, "Token URI cannot be empty");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
        
        return tokenId;
    }
    
    /**
     * @dev 批量铸造 NFT（仅所有者）
     * @param to 接收 NFT 的地址
     * @param uris NFT 元数据的 URI 数组
     * @return tokenIds 返回新铸造的 token ID 数组
     */
    function batchMint(address to, string[] memory uris) public onlyOwner returns (uint256[] memory) {
        require(to != address(0), "Cannot mint to zero address");
        require(uris.length > 0, "URIs array cannot be empty");
        
        uint256[] memory tokenIds = new uint256[](uris.length);
        
        for (uint256 i = 0; i < uris.length; i++) {
            require(bytes(uris[i]).length > 0, "Token URI cannot be empty");
            
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);
            
            emit NFTMinted(to, tokenId, uris[i]);
            tokenIds[i] = tokenId;
        }
        
        return tokenIds;
    }
    
    /**
     * @dev 查询指定 token ID 的元数据 URI
     * @param tokenId token ID
     * @return token URI
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev 检查 token 是否支持某个接口
     * @param interfaceId 接口 ID
     * @return 是否支持
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev 查询当前 token ID 计数器
     * @return 下一个要使用的 token ID
     */
    function currentTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
    
    /**
     * @dev 查询已铸造的 NFT 总数
     * @return 已铸造的 NFT 总数
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }
}


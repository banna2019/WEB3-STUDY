// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BlockInfoRecorderWithToken
 * @dev 结合 ERC20 代币和区块/交易信息记录的示例合约
 * 配合 Go 代码使用，可以记录查询到的区块信息和交易信息
 * 同时提供 NEW Token (NTK) ERC20 代币功能
 */
contract BlockInfoRecorderWithToken is ERC20, Ownable {
    // 区块信息结构体
    struct BlockInfo {
        uint256 blockNumber;      // 区块号
        bytes32 blockHash;        // 区块哈希
        uint256 timestamp;         // 时间戳
        uint256 transactionCount; // 交易数量
        address miner;            // 矿工地址
        uint256 gasLimit;         // Gas 限制
        uint256 gasUsed;          // 已使用 Gas
    }

    // 交易信息结构体
    struct TransactionInfo {
        bytes32 txHash;           // 交易哈希
        address from;             // 发送方地址
        address to;               // 接收方地址
        uint256 value;            // 转账金额（wei 或 token）
        uint256 blockNumber;      // 所在区块号
        uint256 timestamp;        // 交易时间戳
        bool success;             // 交易是否成功
        bool isTokenTransfer;     // 是否为代币转账
    }

    // 事件：区块信息已记录
    event BlockInfoRecorded(
        uint256 indexed blockNumber,
        bytes32 blockHash,
        uint256 timestamp,
        uint256 transactionCount
    );

    // 事件：ETH 交易信息已记录
    event ETHTransactionRecorded(
        bytes32 indexed txHash,
        address indexed from,
        address indexed to,
        uint256 value
    );

    // 事件：ERC20 代币转账已记录
    event TokenTransferRecorded(
        bytes32 indexed txHash,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    // 存储区块信息
    mapping(uint256 => BlockInfo) public blockInfos;
    
    // 存储交易信息
    mapping(bytes32 => TransactionInfo) public transactions;
    
    // 区块号列表
    uint256[] public recordedBlockNumbers;
    
    // 交易哈希列表
    bytes32[] public recordedTxHashes;

    // 代币精度（从构造函数参数传入）
    uint8 private immutable _decimals;

    /**
     * @dev 构造函数，初始化 NEW Token
     * @param _name 代币名称
     * @param _symbol 代币符号
     * @param _decimalsValue 代币精度（例如 18）
     * @param _initialSupply 初始供应量（带精度，例如 100000000 * 10^18）
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimalsValue,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        // 设置代币精度
        _decimals = _decimalsValue;
        // 将初始供应量铸造给部署者
        _mint(msg.sender, _initialSupply);
    }

    /**
     * @dev 重写 decimals 函数，返回代币精度
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev 记录区块信息
     * @param _blockNumber 区块号
     * @param _blockHash 区块哈希
     * @param _timestamp 时间戳
     * @param _transactionCount 交易数量
     * @param _miner 矿工地址
     * @param _gasLimit Gas 限制
     * @param _gasUsed 已使用 Gas
     */
    function recordBlockInfo(
        uint256 _blockNumber,
        bytes32 _blockHash,
        uint256 _timestamp,
        uint256 _transactionCount,
        address _miner,
        uint256 _gasLimit,
        uint256 _gasUsed
    ) external {
        BlockInfo memory info = BlockInfo({
            blockNumber: _blockNumber,
            blockHash: _blockHash,
            timestamp: _timestamp,
            transactionCount: _transactionCount,
            miner: _miner,
            gasLimit: _gasLimit,
            gasUsed: _gasUsed
        });

        // 如果该区块号还未记录，添加到列表（在设置之前检查）
        if (blockInfos[_blockNumber].blockNumber == 0) {
            recordedBlockNumbers.push(_blockNumber);
        }
        
        blockInfos[_blockNumber] = info;

        emit BlockInfoRecorded(
            _blockNumber,
            _blockHash,
            _timestamp,
            _transactionCount
        );
    }

    /**
     * @dev 记录 ETH 交易信息
     * @param _txHash 交易哈希
     * @param _from 发送方地址
     * @param _to 接收方地址
     * @param _value 转账金额（wei）
     * @param _blockNumber 所在区块号
     * @param _timestamp 交易时间戳
     * @param _success 交易是否成功
     */
    function recordETHTransaction(
        bytes32 _txHash,
        address _from,
        address _to,
        uint256 _value,
        uint256 _blockNumber,
        uint256 _timestamp,
        bool _success
    ) external {
        TransactionInfo memory txInfo = TransactionInfo({
            txHash: _txHash,
            from: _from,
            to: _to,
            value: _value,
            blockNumber: _blockNumber,
            timestamp: _timestamp,
            success: _success,
            isTokenTransfer: false
        });

        transactions[_txHash] = txInfo;
        recordedTxHashes.push(_txHash);

        emit ETHTransactionRecorded(_txHash, _from, _to, _value);
    }

    /**
     * @dev 记录 ERC20 代币转账信息
     * @param _txHash 交易哈希
     * @param _from 发送方地址
     * @param _to 接收方地址
     * @param _amount 转账金额（token）
     * @param _blockNumber 所在区块号
     * @param _timestamp 交易时间戳
     * @param _success 交易是否成功
     */
    function recordTokenTransfer(
        bytes32 _txHash,
        address _from,
        address _to,
        uint256 _amount,
        uint256 _blockNumber,
        uint256 _timestamp,
        bool _success
    ) external {
        TransactionInfo memory txInfo = TransactionInfo({
            txHash: _txHash,
            from: _from,
            to: _to,
            value: _amount,
            blockNumber: _blockNumber,
            timestamp: _timestamp,
            success: _success,
            isTokenTransfer: true
        });

        transactions[_txHash] = txInfo;
        recordedTxHashes.push(_txHash);

        emit TokenTransferRecorded(_txHash, _from, _to, _amount);
    }

    /**
     * @dev 查询区块信息
     * @param _blockNumber 区块号
     * @return 区块信息结构体
     */
    function getBlockInfo(uint256 _blockNumber) 
        external 
        view 
        returns (BlockInfo memory) 
    {
        return blockInfos[_blockNumber];
    }

    /**
     * @dev 查询交易信息
     * @param _txHash 交易哈希
     * @return 交易信息结构体
     */
    function getTransaction(bytes32 _txHash) 
        external 
        view 
        returns (TransactionInfo memory) 
    {
        return transactions[_txHash];
    }

    /**
     * @dev 获取已记录的区块数量
     * @return 区块数量
     */
    function getRecordedBlockCount() external view returns (uint256) {
        return recordedBlockNumbers.length;
    }

    /**
     * @dev 获取已记录的交易数量
     * @return 交易数量
     */
    function getRecordedTxCount() external view returns (uint256) {
        return recordedTxHashes.length;
    }

    /**
     * @dev 铸造代币（仅所有者）
     * @param _to 接收地址
     * @param _amount 铸造数量
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    /**
     * @dev 销毁代币
     * @param _amount 销毁数量
     */
    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
    }

    /**
     * @dev 接收 ETH 的函数（用于测试 ETH 转账）
     */
    receive() external payable {
        // 可以在这里记录接收到的 ETH
    }

    /**
     * @dev 提取合约中的 ETH（仅所有者）
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev 获取合约 ETH 余额
     * @return 合约余额（wei）
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev 获取账户代币余额
     * @param _account 账户地址
     * @return 代币余额
     */
    function getTokenBalance(address _account) external view returns (uint256) {
        return balanceOf(_account);
    }

    /**
     * @dev 获取代币总供应量
     * @return 总供应量
     */
    function getTotalSupply() external view returns (uint256) {
        return totalSupply();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title BeggingContract
 * @dev 一个允许用户向合约捐赠以太币的合约
 * @notice 记录每个捐赠者的地址和金额，允许合约所有者提取所有资金
 */
contract BeggingContract {
    // 合约所有者
    address public owner;
    
    // 记录每个地址的捐赠金额
    mapping(address => uint256) public donations;
    
    // 记录所有捐赠者的地址
    address[] public donors;
    
    // 合约总余额
    uint256 public totalDonations;
    
    // 事件：记录每次捐赠
    event Donation(address indexed donor, uint256 amount, uint256 timestamp);
    
    // 事件：记录提取资金
    event Withdrawal(address indexed owner, uint256 amount, uint256 timestamp);
    
    // 修饰符：只有所有者可以调用
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev 构造函数
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev 捐赠函数，允许用户向合约发送以太币
     * @notice 使用 payable 修饰符，允许接收以太币
     */
    function donate() public payable {
        require(msg.value > 0, "Donation amount must be greater than 0");
        
        // 如果是新捐赠者，添加到列表中
        if (donations[msg.sender] == 0) {
            donors.push(msg.sender);
        }
        
        // 更新捐赠记录
        donations[msg.sender] += msg.value;
        totalDonations += msg.value;
        
        // 触发事件
        emit Donation(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev 提取函数，允许合约所有者提取所有资金
     * @notice 只有所有者可以调用
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        // 使用 transfer 发送资金
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
        
        // 触发事件
        emit Withdrawal(owner, balance, block.timestamp);
    }
    
    /**
     * @dev 查询某个地址的捐赠金额
     * @param donor 捐赠者地址
     * @return 该地址的累计捐赠金额
     */
    function getDonation(address donor) public view returns (uint256) {
        return donations[donor];
    }
    
    /**
     * @dev 获取合约当前余额
     * @return 合约余额（以 wei 为单位）
     */
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev 获取捐赠者总数
     * @return 捐赠者总数
     */
    function getDonorCount() public view returns (uint256) {
        return donors.length;
    }
    
    /**
     * @dev 获取指定索引的捐赠者地址
     * @param index 索引
     * @return 捐赠者地址
     */
    function getDonor(uint256 index) public view returns (address) {
        require(index < donors.length, "Index out of bounds");
        return donors[index];
    }
    
    /**
     * @dev 获取总捐赠金额
     * @return 总捐赠金额
     */
    function getTotalDonations() public view returns (uint256) {
        return totalDonations;
    }
    
    /**
     * @dev 接收以太币的回退函数
     * @notice 当合约直接收到以太币时，视为捐赠
     */
    receive() external payable {
        donate();
    }
    
    /**
     * @dev 回退函数
     * @notice 当调用不存在的函数时，如果发送了以太币，视为捐赠
     */
    fallback() external payable {
        donate();
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ERC20Token
 * @dev 实现标准 ERC20 代币合约
 * @notice 包含标准 ERC20 功能和 mint 功能
 */
contract ERC20Token {
    // 代币名称
    string public name;
    
    // 代币符号
    string public symbol;
    
    // 代币精度（小数位数）
    uint8 public decimals;
    
    // 总供应量
    uint256 public totalSupply;
    
    // 合约所有者
    address public owner;
    
    // 账户余额映射
    mapping(address => uint256) public balanceOf;
    
    // 授权映射：授权者 => 被授权者 => 授权金额
    mapping(address => mapping(address => uint256)) public allowance;
    
    // 事件：转账
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    // 事件：授权
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    // 事件：增发
    event Mint(address indexed to, uint256 value);
    
    // 修饰符：只有所有者可以调用
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev 构造函数
     * @param _name 代币名称
     * @param _symbol 代币符号
     * @param _decimals 代币精度（通常为 18）
     * @param _initialSupply 初始供应量
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender;
        
        // 将初始供应量分配给部署者
        totalSupply = _initialSupply * 10**uint256(_decimals);
        balanceOf[msg.sender] = totalSupply;
        
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    /**
     * @dev 转账代币
     * @param to 接收者地址
     * @param value 转账金额
     * @return 是否成功
     */
    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "Transfer to the zero address");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        
        emit Transfer(msg.sender, to, value);
        
        return true;
    }
    
    /**
     * @dev 授权其他地址使用代币
     * @param spender 被授权者地址
     * @param value 授权金额
     * @return 是否成功
     */
    function approve(address spender, uint256 value) public returns (bool) {
        require(spender != address(0), "Approve to the zero address");
        
        allowance[msg.sender][spender] = value;
        
        emit Approval(msg.sender, spender, value);
        
        return true;
    }
    
    /**
     * @dev 从授权账户转账代币
     * @param from 授权者地址
     * @param to 接收者地址
     * @param value 转账金额
     * @return 是否成功
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool) {
        require(from != address(0), "Transfer from the zero address");
        require(to != address(0), "Transfer to the zero address");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        
        emit Transfer(from, to, value);
        
        return true;
    }
    
    /**
     * @dev 增发代币（只有所有者可以调用）
     * @param to 接收者地址
     * @param value 增发金额
     */
    function mint(address to, uint256 value) public onlyOwner {
        require(to != address(0), "Mint to the zero address");
        
        totalSupply += value;
        balanceOf[to] += value;
        
        emit Mint(to, value);
        emit Transfer(address(0), to, value);
    }
    
}


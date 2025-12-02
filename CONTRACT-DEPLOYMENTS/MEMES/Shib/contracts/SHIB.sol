// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IUniswapV2Pair.sol";

/**
 * @title SHIB Meme Token Contract
 * @dev SHIB风格的Meme代币合约，包含代币税、流动性池集成和交易限制功能
 * 
 * 功能说明：
 * 1. 代币税功能：对每笔交易征收一定比例的税费，分配给指定地址
 * 2. 流动性池集成：支持添加和移除流动性，与Uniswap V2完全集成
 * 3. 交易限制功能：单笔交易最大额度、每日交易次数限制
 * 
 * 安全特性：
 * - 继承ReentrancyGuard防止重入攻击
 * - 所有流动性操作函数使用nonReentrant修饰符
 * - 完整的参数验证和错误处理
 */
contract SHIB is Ownable, ERC20, ReentrancyGuard {
    // ========== 状态变量 ==========
    
    /// @notice 交易税率（基点，10000 = 100%）
    /// @dev 例如：500 = 5%，1000 = 10%
    uint256 public taxRate;
    
    /// @notice 税收接收地址
    /// @dev 税费将发送到此地址
    address public taxReceiver;
    
    /// @notice 税收是否启用
    /// @dev true表示启用税收，false表示禁用
    bool public taxEnabled;
    
    /// @notice 交易限制是否启用
    /// @dev true表示启用交易限制，false表示禁用
    bool public transactionLimitsEnabled;
    
    /// @notice 单笔交易最大额度（0表示无限制）
    /// @dev 如果设置为0，则不限制单笔交易额度
    uint256 public maxTransactionAmount;
    
    /// @notice 每日最大交易次数（0表示无限制）
    /// @dev 如果设置为0，则不限制每日交易次数
    uint256 public maxDailyTransactions;
    
    /// @notice 黑名单映射
    /// @dev 黑名单地址不能进行转账
    mapping(address => bool) public blacklists;
    
    /// @notice 白名单映射
    /// @dev 白名单地址转账时免税
    mapping(address => bool) public whitelist;
    
    /// @notice 地址的每日交易次数
    /// @dev 记录每个地址每日的交易次数
    mapping(address => uint256) public dailyTransactionCount;
    
    /// @notice 地址的最后重置时间
    /// @dev 用于重置每日交易次数
    mapping(address => uint256) public lastResetTime;
    
    /// @notice Uniswap V2 Router地址
    /// @dev 用于添加和移除流动性
    address public uniswapV2Router;
    
    /// @notice Uniswap V2 Factory地址
    /// @dev 用于创建和获取交易对
    address public uniswapV2Factory;
    
    /// @notice Uniswap V2 Pair地址
    /// @dev SHIB/WETH交易对地址
    address public uniswapV2Pair;
    
    /// @notice 自动流动性注入是否启用
    /// @dev true表示启用自动流动性注入，false表示禁用
    bool public autoLiquidityEnabled;
    
    /// @notice 自动流动性注入阈值
    /// @dev 当合约余额达到此阈值时，可以触发自动流动性注入
    uint256 public autoLiquidityThreshold;
    
    // ========== 事件 ==========
    
    /**
     * @notice 税率变更事件
     * @param newRate 新税率（基点）
     * @param receiver 税收接收地址
     */
    event TaxRateChanged(uint256 newRate, address receiver);
    
    /**
     * @notice 交易限制变更事件
     * @param maxAmount 单笔交易最大额度
     * @param maxDaily 每日最大交易次数
     */
    event TransactionLimitsChanged(uint256 maxAmount, uint256 maxDaily);
    
    /**
     * @notice 黑名单更新事件
     * @param account 地址
     * @param isBlacklisted 是否加入黑名单
     */
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    
    /**
     * @notice 白名单更新事件
     * @param account 地址
     * @param isWhitelisted 是否加入白名单
     */
    event WhitelistUpdated(address indexed account, bool isWhitelisted);
    
    /**
     * @notice Uniswap V2 Router设置事件
     * @param router Router地址
     */
    event UniswapV2RouterSet(address indexed router);
    
    /**
     * @notice Uniswap V2 Factory设置事件
     * @param factory Factory地址
     */
    event UniswapV2FactorySet(address indexed factory);
    
    /**
     * @notice Uniswap V2 Pair设置事件
     * @param pair Pair地址
     */
    event UniswapV2PairSet(address indexed pair);
    
    /**
     * @notice 流动性添加事件
     * @param amountToken 添加的代币数量
     * @param amountETH 添加的ETH数量
     * @param liquidity LP代币数量
     */
    event LiquidityAdded(uint256 amountToken, uint256 amountETH, uint256 liquidity);
    
    /**
     * @notice 流动性移除事件
     * @param lpTokenAmount LP代币数量
     * @param amountToken 移除的代币数量
     * @param amountETH 移除的ETH数量
     */
    event LiquidityRemoved(uint256 lpTokenAmount, uint256 amountToken, uint256 amountETH);
    
    /**
     * @notice 自动流动性注入事件
     * @param amountToken 注入的代币数量
     * @param amountETH 注入的ETH数量
     */
    event AutoLiquidityInjected(uint256 amountToken, uint256 amountETH);
    
    // ========== 构造函数 ==========
    
    /**
     * @notice 构造函数
     * @param name_ 代币名称
     * @param symbol_ 代币符号
     * @param totalSupply_ 总供应量
     * @param taxRate_ 初始税率（基点）
     * @param taxReceiver_ 税收接收地址
     * @dev 部署时将总供应量分配给部署者，并将部署者加入白名单
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        uint256 taxRate_,
        address taxReceiver_
    ) Ownable(msg.sender) ERC20(name_, symbol_) {
        require(taxReceiver_ != address(0), "SHIB: Tax receiver cannot be zero address");
        require(taxRate_ <= 2000, "SHIB: Tax rate cannot exceed 20%");
        
        taxRate = taxRate_;
        taxReceiver = taxReceiver_;
        taxEnabled = taxRate_ > 0;
        
        // 将总供应量分配给部署者
        _mint(msg.sender, totalSupply_);
        
        // 将部署者加入白名单（避免初始转账时扣除税费）
        whitelist[msg.sender] = true;
        emit WhitelistUpdated(msg.sender, true);
    }
    
    // ========== 代币税功能 ==========
    
    /**
     * @notice 设置税率
     * @param newRate 新税率（基点，10000 = 100%）
     * @param receiver 税收接收地址
     * @dev 只有合约拥有者可以调用，税率不能超过20%
     */
    function setTaxRate(uint256 newRate, address receiver) external onlyOwner {
        require(receiver != address(0), "SHIB: Tax receiver cannot be zero address");
        require(newRate <= 2000, "SHIB: Tax rate cannot exceed 20%");
        
        taxRate = newRate;
        taxReceiver = receiver;
        taxEnabled = newRate > 0;
        
        emit TaxRateChanged(newRate, receiver);
    }
    
    /**
     * @notice 计算交易税费
     * @param amount 交易金额
     * @param from 发送者地址
     * @param to 接收者地址
     * @return 税费金额
     * @dev 白名单地址免税
     */
    function calculateTax(
        uint256 amount,
        address from,
        address to
    ) public view returns (uint256) {
        // 如果税收未启用，返回0
        if (!taxEnabled || taxRate == 0) {
            return 0;
        }
        
        // 白名单地址免税
        if (whitelist[from] || whitelist[to]) {
            return 0;
        }
        
        // 计算税费
        return (amount * taxRate) / 10000;
    }
    
    // ========== 交易限制功能 ==========
    
    /**
     * @notice 设置交易限制
     * @param maxAmount 单笔交易最大额度（0表示无限制）
     * @param maxDaily 每日最大交易次数（0表示无限制）
     * @dev 只有合约拥有者可以调用
     */
    function setTransactionLimits(
        uint256 maxAmount,
        uint256 maxDaily
    ) external onlyOwner {
        maxTransactionAmount = maxAmount;
        maxDailyTransactions = maxDaily;
        transactionLimitsEnabled = maxAmount > 0 || maxDaily > 0;
        
        emit TransactionLimitsChanged(maxAmount, maxDaily);
    }
    
    /**
     * @notice 检查交易限制
     * @param from 发送者地址
     * @param amount 交易金额
     * @dev 内部函数，在转账前调用
     */
    function _checkTransactionLimits(address from, uint256 amount) internal {
        // 如果限制未启用，跳过检查
        if (!transactionLimitsEnabled) {
            return;
        }
        
        // 检查单笔交易最大额度
        if (maxTransactionAmount > 0) {
            require(
                amount <= maxTransactionAmount,
                "SHIB: Transaction amount exceeds maximum"
            );
        }
        
        // 检查每日交易次数限制
        if (maxDailyTransactions > 0) {
            // 检查是否需要重置每日计数
            if (block.timestamp >= lastResetTime[from] + 1 days) {
                dailyTransactionCount[from] = 0;
                lastResetTime[from] = block.timestamp;
            }
            
            // 检查是否超过每日限制
            require(
                dailyTransactionCount[from] < maxDailyTransactions,
                "SHIB: Daily transaction limit exceeded"
            );
            
            // 增加交易计数
            dailyTransactionCount[from]++;
        }
    }
    
    // ========== 黑名单/白名单功能 ==========
    
    /**
     * @notice 更新黑名单
     * @param account 地址
     * @param isBlacklisted 是否加入黑名单
     * @dev 只有合约拥有者可以调用
     */
    function updateBlacklist(address account, bool isBlacklisted) external onlyOwner {
        require(account != address(0), "SHIB: Cannot blacklist zero address");
        blacklists[account] = isBlacklisted;
        emit BlacklistUpdated(account, isBlacklisted);
    }
    
    /**
     * @notice 批量更新黑名单
     * @param accounts 地址数组
     * @param isBlacklisted 是否加入黑名单
     * @dev 只有合约拥有者可以调用
     */
    function updateBlacklistBatch(
        address[] memory accounts,
        bool isBlacklisted
    ) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != address(0)) {
                blacklists[accounts[i]] = isBlacklisted;
                emit BlacklistUpdated(accounts[i], isBlacklisted);
            }
        }
    }
    
    /**
     * @notice 更新白名单
     * @param account 地址
     * @param isWhitelisted 是否加入白名单
     * @dev 只有合约拥有者可以调用
     */
    function updateWhitelist(address account, bool isWhitelisted) external onlyOwner {
        require(account != address(0), "SHIB: Cannot whitelist zero address");
        whitelist[account] = isWhitelisted;
        emit WhitelistUpdated(account, isWhitelisted);
    }
    
    /**
     * @notice 批量更新白名单
     * @param accounts 地址数组
     * @param isWhitelisted 是否加入白名单
     * @dev 只有合约拥有者可以调用
     */
    function updateWhitelistBatch(
        address[] memory accounts,
        bool isWhitelisted
    ) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != address(0)) {
                whitelist[accounts[i]] = isWhitelisted;
                emit WhitelistUpdated(accounts[i], isWhitelisted);
            }
        }
    }
    
    // ========== 流动性池集成功能 ==========
    
    /**
     * @notice 设置Uniswap V2 Factory地址
     * @param factory Factory地址
     * @dev 只有合约拥有者可以调用，用于手动设置或修正Factory地址
     */
    function setUniswapV2Factory(address factory) external onlyOwner {
        require(factory != address(0), "SHIB: Factory address cannot be zero");
        uniswapV2Factory = factory;
        emit UniswapV2FactorySet(factory);
    }
    
    /**
     * @notice 设置Uniswap V2 Router地址
     * @param router Router地址
     * @dev 只有合约拥有者可以调用，如果Factory未设置则自动获取Factory地址
     */
    // router地址：0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
    function setUniswapV2Router(address router) external onlyOwner {
        require(router != address(0), "SHIB: Router address cannot be zero");
        // uniswapV2Router地址: 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008
        uniswapV2Router = router;
        
        // 如果Factory未设置，自动获取Factory地址
        if (uniswapV2Factory == address(0)) {
            try IUniswapV2Router02(router).factory() returns (address factory) {
                uniswapV2Factory = factory;
                // uniswapV2Factory地址: 0xF62c03E08ada871A0bEb309762E260a7a6a880E6
            } catch {
                revert("SHIB: Invalid router address");
            }
        }
        
        emit UniswapV2RouterSet(router);
    }
    
    /**
     * @notice 设置Uniswap V2交易对地址
     * @param pair 交易对地址
     * @dev 只有合约拥有者可以调用
     */
    function setUniswapV2Pair(address pair) external onlyOwner {
        require(pair != address(0), "SHIB: Pair address cannot be zero");
        // uniswapV2Pair地址: 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3
        uniswapV2Pair = pair;
        emit UniswapV2PairSet(pair);
    }
    
    /**
     * @notice 自动创建或获取交易对地址
     * @return pair 交易对地址
     * @dev 只有合约拥有者可以调用
     */
    function createOrGetPair() external onlyOwner returns (address) {
        require(uniswapV2Factory != address(0), "SHIB: Factory not set");
        require(uniswapV2Router != address(0), "SHIB: Router not set");
        
        // 获取WETH地址
        // weth地址: 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
        address weth = IUniswapV2Router02(uniswapV2Router).WETH();
        
        // 获取或创建交易对
        // 这个时候pair还是空的，所以会创建新的交易对
        address pair = IUniswapV2Factory(uniswapV2Factory).getPair(address(this), weth);
        if (pair == address(0)) {
            // 创建新的交易对
            pair = IUniswapV2Factory(uniswapV2Factory).createPair(address(this), weth);
        }
        
        uniswapV2Pair = pair;
        emit UniswapV2PairSet(pair);
        
        return pair;
    }
    
    /**
     * @notice 添加流动性
     * @param tokenAmount 代币数量
     * @param amountTokenMin 最小代币数量（滑点保护）
     * @param amountETHMin 最小ETH数量（滑点保护）
     * @param deadline 交易截止时间（Unix时间戳）
     * @dev 用户需要先授权合约使用代币，然后调用此函数添加流动性
     */
    function addLiquidity(
        uint256 tokenAmount,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        uint256 deadline
    ) external payable nonReentrant {
        require(uniswapV2Router != address(0), "SHIB: Router not set");
        require(msg.value > 0, "SHIB: ETH amount must be greater than 0");
        require(tokenAmount > 0, "SHIB: Token amount must be greater than 0");
        require(deadline >= block.timestamp, "SHIB: Deadline has passed");
        require(!blacklists[_msgSender()], "SHIB: Sender is blacklisted");
        
        // 从用户转账代币到合约
        _transfer(_msgSender(), address(this), tokenAmount);
        
        // 授权Router使用合约中的代币
        _approve(address(this), uniswapV2Router, tokenAmount);
        
        // 调用Router添加流动性
        (uint256 amountToken, uint256 amountETH, uint256 liquidity) = 
            IUniswapV2Router02(uniswapV2Router).addLiquidityETH{value: msg.value}(
                address(this),
                tokenAmount,
                amountTokenMin,
                amountETHMin,
                _msgSender(),
                deadline
            );
        
        // 如果有多余的代币，退还给用户
        if (tokenAmount > amountToken) {
            // 注意：使用super._transfer避免触发税费计算（这是退款）
            super._transfer(address(this), _msgSender(), tokenAmount - amountToken);
        }
        
        emit LiquidityAdded(amountToken, amountETH, liquidity);
    }
    
    /**
     * @notice 移除流动性
     * @param lpTokenAmount LP代币数量
     * @param amountTokenMin 最小代币数量（滑点保护）
     * @param amountETHMin 最小ETH数量（滑点保护）
     * @param deadline 交易截止时间（Unix时间戳）
     * @dev 用户需要先授权合约使用LP代币，然后调用此函数移除流动性
     */
    function removeLiquidity(
        uint256 lpTokenAmount,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        uint256 deadline
    ) external nonReentrant {
        require(uniswapV2Router != address(0), "SHIB: Router not set");
        require(uniswapV2Pair != address(0), "SHIB: Pair not set");
        require(lpTokenAmount > 0, "SHIB: LP token amount must be greater than 0");
        require(deadline >= block.timestamp, "SHIB: Deadline has passed");
        require(!blacklists[_msgSender()], "SHIB: Sender is blacklisted");
        
        // 从用户转账LP代币到合约
        IUniswapV2Pair(uniswapV2Pair).transferFrom(_msgSender(), address(this), lpTokenAmount);
        
        // 授权Router使用合约中的LP代币
        IUniswapV2Pair(uniswapV2Pair).approve(uniswapV2Router, lpTokenAmount);
        
        // 调用Router移除流动性
        (uint256 amountToken, uint256 amountETH) = 
            IUniswapV2Router02(uniswapV2Router).removeLiquidityETH(
                address(this),
                lpTokenAmount,
                amountTokenMin,
                amountETHMin,
                _msgSender(),
                deadline
            );
        
        emit LiquidityRemoved(lpTokenAmount, amountToken, amountETH);
    }
    
    /**
     * @notice 设置自动流动性注入
     * @param enabled 是否启用
     * @param threshold 阈值（当合约余额达到此值时触发）
     * @dev 只有合约拥有者可以调用
     */
    function setAutoLiquidity(bool enabled, uint256 threshold) external onlyOwner {
        autoLiquidityEnabled = enabled;
        autoLiquidityThreshold = threshold;
    }
    
    /**
     * @notice 触发自动流动性注入
     * @dev 只有合约拥有者可以调用，需要先启用自动流动性注入
     */
    function triggerAutoLiquidity() external onlyOwner nonReentrant {
        require(autoLiquidityEnabled, "SHIB: Auto liquidity not enabled");
        require(uniswapV2Router != address(0), "SHIB: Router not set");
        require(uniswapV2Pair != address(0), "SHIB: Pair not set");
        
        uint256 balance = balanceOf(address(this));
        require(balance >= autoLiquidityThreshold, "SHIB: Balance below threshold");
        
        uint256 halfBalance = balance / 2;
        uint256 ethBalance = address(this).balance;
        
        // 授权Router使用代币
        _approve(address(this), uniswapV2Router, halfBalance);
        
        // 添加流动性
        (uint256 amountToken, uint256 amountETH, ) = 
            IUniswapV2Router02(uniswapV2Router).addLiquidityETH{value: ethBalance}(
                address(this),
                halfBalance,
                0,
                0,
                address(this),
                block.timestamp + 300
            );
        
        emit AutoLiquidityInjected(amountToken, amountETH);
    }
    
    // ========== 重写ERC20转账函数 ==========
    
    /**
     * @notice 转账代币（重写ERC20的transfer函数）
     * @param to 接收者地址
     * @param amount 转账金额
     * @return 是否成功
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = _msgSender();
        _transferWithTax(owner, to, amount);
        return true;
    }
    
    /**
     * @notice 代理转账（重写ERC20的transferFrom函数）
     * @param from 发送者地址
     * @param to 接收者地址
     * @param amount 转账金额
     * @return 是否成功
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transferWithTax(from, to, amount);
        return true;
    }
    
    /**
     * @notice 内部转账函数，用于税费转账（绕过黑名单检查）
     * @param from 发送者地址
     * @param to 接收者地址
     * @param amount 转账金额
     * @dev 直接调用父类的_transfer函数，绕过黑名单检查
     */
    function _transferInternal(
        address from,
        address to,
        uint256 amount
    ) internal {
        // 直接调用父类的_transfer函数，绕过黑名单检查
        // 这样可以确保税费转账不会被黑名单机制阻止
        super._transfer(from, to, amount);
    }
    
    /**
     * @notice 带税收的转账函数
     * @param from 发送者地址
     * @param to 接收者地址
     * @param amount 转账金额
     * @dev 内部函数，处理税收和交易限制
     */
    function _transferWithTax(
        address from,
        address to,
        uint256 amount
    ) internal {
        // 检查黑名单（不检查taxReceiver，因为税费转账是内部操作）
        require(!blacklists[from], "SHIB: Sender is blacklisted");
        // 如果接收者是taxReceiver，跳过黑名单检查（税费转账是内部操作）
        if (to != taxReceiver) {
            require(!blacklists[to], "SHIB: Recipient is blacklisted");
        }
        
        // 检查交易限制
        _checkTransactionLimits(from, amount);
        
        // 计算税费（基于from和to，不考虑taxReceiver）
        uint256 tax = calculateTax(amount, from, to);
        uint256 transferAmount = amount - tax;
        
        // 执行转账
        if (tax > 0 && taxReceiver != address(0)) {
            // 转账税费给接收地址
            // 注意：使用_transferInternal直接转账，绕过黑名单检查
            // 税费已经基于from和to计算，不受taxReceiver白名单状态影响
            // 税费转账时，不检查taxReceiver的黑名单状态（因为这是内部操作）
            _transferInternal(from, taxReceiver, tax);
        }
        
        // 转账剩余金额给接收者
        // 注意：使用super._transfer避免重复检查黑名单（已经在_transferWithTax中检查过了）
        super._transfer(from, to, transferAmount);
    }
    
    // ========== 辅助函数 ==========
    
    /**
     * @notice 获取地址的每日交易次数
     * @param account 地址
     * @return 交易次数
     */
    function getDailyTransactionCount(address account) external view returns (uint256) {
        if (block.timestamp >= lastResetTime[account] + 1 days) {
            return 0; // 已过24小时，返回0
        }
        return dailyTransactionCount[account];
    }
    
    /**
     * @notice 接收ETH（允许合约接收ETH）
     * @dev 用于接收意外发送到合约的ETH
     */
    receive() external payable {}
    
    /**
     * @notice 紧急提取ETH（仅限合约拥有者）
     * @dev 用于提取意外发送到合约的ETH
     */
    function emergencyWithdrawETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @notice 紧急提取ERC20代币（仅限合约拥有者）
     * @param token 代币地址
     * @param amount 提取数量
     * @dev 用于提取意外发送到合约的代币
     */
    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        require(token != address(this), "SHIB: Cannot withdraw own token");
        IERC20(token).transfer(owner(), amount);
    }
}


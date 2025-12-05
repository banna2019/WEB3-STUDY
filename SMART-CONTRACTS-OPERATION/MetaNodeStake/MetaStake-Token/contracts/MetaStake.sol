// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IUniswapV2Router02.sol";

/**
 * @title MetaStake
 * @dev 质押系统合约，支持多池质押和MetaNode代币奖励
 */
contract MetaStake is Initializable, UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    // 角色定义
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // 质押池结构
    struct Pool {
        address stakeTokenAddress;        // 质押代币地址（address(0)表示native currency）
        uint256 poolWeight;            // 池权重
        uint256 lastRewardBlock;       // 最后一次计算奖励的区块号
        uint256 accMetaNodePerST;      // 每个质押代币累积的MetaNode数量（乘以1e18）
        uint256 stakeTokenAmount;         // 池中的总质押代币量
        uint256 minDepositAmount;      // 最小质押金额
        uint256 unstakeLockedBlocks;   // 解除质押的锁定区块数
    }

    // 解质押请求结构
    struct UnstakeRequest {
        uint256 amount;                // 解质押数量
        uint256 unlockBlock;           // 解锁区块号
    }

    // 用户信息结构
    struct User {
        uint256 stAmount;              // 用户质押的代币数量
        uint256 finishedMetaNode;      // 已分配的MetaNode数量
        uint256 pendingMetaNode;       // 待领取的MetaNode数量
        UnstakeRequest[] requests;     // 解质押请求列表
    }

    // 状态变量
    IERC20 public metaNodeToken;       // MetaNode代币地址
    uint256 public totalPools;         // 总池数
    uint256 public metaNodePerBlock;   // 每个区块的MetaNode奖励数量
    uint256 public startBlock;         // 开始区块号
    IUniswapV2Router02 public uniswapRouter; // Uniswap V2 Router地址

    // 映射
    mapping(uint256 => Pool) public pools;                    // 池ID => 池信息
    mapping(uint256 => mapping(address => User)) public users; // 池ID => 用户地址 => 用户信息

    // 暂停类型枚举
    enum PauseType {
        Stake,
        Unstake,
        Claim
    }

    // 暂停状态映射
    mapping(PauseType => bool) public pauseStatus;

    // 事件
    event PoolAdded(uint256 indexed pid, address indexed stakeTokenAddress, uint256 poolWeight);
    event PoolUpdated(uint256 indexed pid, uint256 poolWeight, uint256 minDepositAmount, uint256 unstakeLockedBlocks);
    event Staked(address indexed user, uint256 indexed pid, uint256 amount);
    event Unstaked(address indexed user, uint256 indexed pid, uint256 amount, uint256 unlockBlock);
    event Claimed(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdrawn(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardUpdated(uint256 indexed pid, uint256 accMetaNodePerST);
    event PauseStatusChanged(PauseType pauseType, bool paused);
    event UniswapRouterSet(address indexed oldRouter, address indexed newRouter);
    event ClaimedAndSwapped(address indexed user, uint256 indexed pid, uint256 metaNodeAmount, address outputToken, uint256 outputAmount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev 初始化函数
     * @param _metaNodeToken MetaNode代币地址
     * @param _metaNodePerBlock 每个区块的MetaNode奖励数量
     * @param _startBlock 开始区块号
     * @param _admin 管理员地址
     */
    function initialize(
        address _metaNodeToken,
        uint256 _metaNodePerBlock,
        uint256 _startBlock,
        address _admin
    ) public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        require(_metaNodeToken != address(0), "Invalid metaNode token address");
        require(_admin != address(0), "Invalid admin address");

        metaNodeToken = IERC20(_metaNodeToken);
        metaNodePerBlock = _metaNodePerBlock;
        startBlock = _startBlock;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);
    }

    /**
     * @dev 授权升级（仅UPGRADER_ROLE）
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev 设置暂停状态
     * @param pauseType 暂停类型
     * @param paused 是否暂停
     */
    function setPauseStatus(PauseType pauseType, bool paused) external onlyRole(ADMIN_ROLE) {
        pauseStatus[pauseType] = paused;
        emit PauseStatusChanged(pauseType, paused);
    }

    /**
     * @dev 设置每个区块的MetaNode奖励数量
     * @param _metaNodePerBlock 每个区块的MetaNode奖励数量
     */
    function setMetaNodePerBlock(uint256 _metaNodePerBlock) external onlyRole(ADMIN_ROLE) {
        // 更新所有池的奖励
        for (uint256 pid = 0; pid < totalPools; pid++) {
            updatePool(pid);
        }
        metaNodePerBlock = _metaNodePerBlock;
    }

    /**
     * @dev 设置Uniswap Router地址
     * @param _uniswapRouter Uniswap V2 Router地址
     */
    function setUniswapRouter(address _uniswapRouter) external onlyRole(ADMIN_ROLE) {
        require(_uniswapRouter != address(0), "Invalid router address");
        address oldRouter = address(uniswapRouter);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        emit UniswapRouterSet(oldRouter, _uniswapRouter);
    }

    /**
     * @dev 添加质押池
     * @param _stakeTokenAddress 质押代币地址（address(0)表示native currency）
     * @param _poolWeight 池权重
     * @param _minDepositAmount 最小质押金额
     * @param _unstakeLockedBlocks 解除质押的锁定区块数
     */
    function addPool(
        address _stakeTokenAddress,
        uint256 _poolWeight,
        uint256 _minDepositAmount,
        uint256 _unstakeLockedBlocks
    ) external onlyRole(ADMIN_ROLE) {
        uint256 pid = totalPools;
        pools[pid] = Pool({
            stakeTokenAddress: _stakeTokenAddress,
            poolWeight: _poolWeight,
            lastRewardBlock: block.number > startBlock ? block.number : startBlock,
            accMetaNodePerST: 0,
            stakeTokenAmount: 0,
            minDepositAmount: _minDepositAmount,
            unstakeLockedBlocks: _unstakeLockedBlocks
        });
        totalPools++;
        emit PoolAdded(pid, _stakeTokenAddress, _poolWeight);
    }

    /**
     * @dev 更新质押池配置
     * @param _pid 池ID
     * @param _poolWeight 池权重
     * @param _minDepositAmount 最小质押金额
     * @param _unstakeLockedBlocks 解除质押的锁定区块数
     */
    function updatePoolConfig(
        uint256 _pid,
        uint256 _poolWeight,
        uint256 _minDepositAmount,
        uint256 _unstakeLockedBlocks
    ) external onlyRole(ADMIN_ROLE) {
        require(_pid < totalPools, "Pool does not exist");
        updatePool(_pid);
        pools[_pid].poolWeight = _poolWeight;
        pools[_pid].minDepositAmount = _minDepositAmount;
        pools[_pid].unstakeLockedBlocks = _unstakeLockedBlocks;
        emit PoolUpdated(_pid, _poolWeight, _minDepositAmount, _unstakeLockedBlocks);
    }

    /**
     * @dev 更新池的奖励
     * @param _pid 池ID
     */
    function updatePool(uint256 _pid) public {
        require(_pid < totalPools, "Pool does not exist");
        Pool storage pool = pools[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        if (pool.stakeTokenAmount == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        // 计算总权重
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < totalPools; i++) {
            totalWeight += pools[i].poolWeight;
        }

        if (totalWeight == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        // 计算该池应得的奖励
        uint256 blocks = block.number - pool.lastRewardBlock;
        uint256 poolReward = (blocks * metaNodePerBlock * pool.poolWeight) / totalWeight;
        
        // 更新累积奖励
        pool.accMetaNodePerST += (poolReward * 1e18) / pool.stakeTokenAmount;
        pool.lastRewardBlock = block.number;

        emit RewardUpdated(_pid, pool.accMetaNodePerST);
    }

    /**
     * @dev 质押代币
     * @param _pid 池ID
     * @param _amount 质押数量
     */
    function stake(uint256 _pid, uint256 _amount) external payable whenNotPaused {
        require(!pauseStatus[PauseType.Stake], "Staking is paused");
        require(_pid < totalPools, "Pool does not exist");
        require(_amount >= pools[_pid].minDepositAmount, "Amount below minimum");

        Pool storage pool = pools[_pid];
        User storage user = users[_pid][msg.sender];

        // 更新池奖励
        updatePool(_pid);

        // 更新用户奖励
        if (user.stAmount > 0) {
            uint256 pending = (user.stAmount * pool.accMetaNodePerST) / 1e18 - user.finishedMetaNode;
            user.pendingMetaNode += pending;
        }

        // 处理代币转账
        if (pool.stakeTokenAddress == address(0)) {
            // Native currency
            require(msg.value == _amount, "Incorrect ETH amount");
        } else {
            // ERC20代币
            require(msg.value == 0, "ETH not needed for ERC20 pool");
            IERC20(pool.stakeTokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        }

        // 更新用户和池的状态
        user.stAmount += _amount;
        user.finishedMetaNode = (user.stAmount * pool.accMetaNodePerST) / 1e18;
        pool.stakeTokenAmount += _amount;

        emit Staked(msg.sender, _pid, _amount);
    }

    /**
     * @dev 解除质押
     * @param _pid 池ID
     * @param _amount 解除质押数量
     */
    function unstake(uint256 _pid, uint256 _amount) external whenNotPaused {
        require(!pauseStatus[PauseType.Unstake], "Unstaking is paused");
        require(_pid < totalPools, "Pool does not exist");
        
        Pool storage pool = pools[_pid];
        User storage user = users[_pid][msg.sender];

        require(user.stAmount >= _amount, "Insufficient staked amount");

        // 更新池奖励
        updatePool(_pid);

        // 更新用户奖励
        uint256 pending = (user.stAmount * pool.accMetaNodePerST) / 1e18 - user.finishedMetaNode;
        user.pendingMetaNode += pending;

        // 更新用户和池的状态
        user.stAmount -= _amount;
        user.finishedMetaNode = (user.stAmount * pool.accMetaNodePerST) / 1e18;
        pool.stakeTokenAmount -= _amount;

        // 创建解质押请求
        uint256 unlockBlock = block.number + pool.unstakeLockedBlocks;
        user.requests.push(UnstakeRequest({
            amount: _amount,
            unlockBlock: unlockBlock
        }));

        emit Unstaked(msg.sender, _pid, _amount, unlockBlock);
    }

    /**
     * @dev 提取已解锁的代币
     * @param _pid 池ID
     */
    function withdraw(uint256 _pid) external {
        require(_pid < totalPools, "Pool does not exist");
        
        User storage user = users[_pid][msg.sender];
        Pool storage pool = pools[_pid];

        uint256 totalWithdrawable = 0;
        uint256 remainingRequests = 0;

        // 遍历所有请求，找出可提取的
        for (uint256 i = 0; i < user.requests.length; i++) {
            if (block.number >= user.requests[i].unlockBlock) {
                totalWithdrawable += user.requests[i].amount;
            } else {
                remainingRequests++;
            }
        }

        require(totalWithdrawable > 0, "No withdrawable amount");

        // 重新组织请求数组，移除已解锁的请求
        // 使用倒序删除的方式，避免数组索引问题
        for (uint256 i = user.requests.length; i > 0; i--) {
            uint256 index = i - 1;
            if (block.number >= user.requests[index].unlockBlock) {
                // 删除已解锁的请求：将最后一个元素移到当前位置，然后删除最后一个
                if (index != user.requests.length - 1) {
                    user.requests[index] = user.requests[user.requests.length - 1];
                }
                user.requests.pop();
            }
        }

        // 转账代币
        if (pool.stakeTokenAddress == address(0)) {
            // Native currency
            (bool success, ) = payable(msg.sender).call{value: totalWithdrawable}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20代币
            IERC20(pool.stakeTokenAddress).safeTransfer(msg.sender, totalWithdrawable);
        }

        emit Withdrawn(msg.sender, _pid, totalWithdrawable);
    }

    /**
     * @dev 领取奖励
     * @param _pid 池ID
     */
    function claim(uint256 _pid) external whenNotPaused {
        require(!pauseStatus[PauseType.Claim], "Claiming is paused");
        require(_pid < totalPools, "Pool does not exist");

        Pool storage pool = pools[_pid];
        User storage user = users[_pid][msg.sender];

        // 更新池奖励
        updatePool(_pid);

        // 计算待领取的奖励
        uint256 pending = (user.stAmount * pool.accMetaNodePerST) / 1e18 - user.finishedMetaNode;
        user.pendingMetaNode += pending;
        user.finishedMetaNode = (user.stAmount * pool.accMetaNodePerST) / 1e18;

        if (user.pendingMetaNode > 0) {
            uint256 claimAmount = user.pendingMetaNode;
            user.pendingMetaNode = 0;
            metaNodeToken.safeTransfer(msg.sender, claimAmount);
            emit Claimed(msg.sender, _pid, claimAmount);
        }
    }

    /**
     * @dev 领取奖励并自动通过Uniswap交换成其他代币
     * @param _pid 池ID
     * @param _outputToken 输出代币地址（address(0)表示ETH）
     * @param _amountOutMin 最小输出数量（滑点保护）
     * @param _deadline 交易截止时间
     */
    function claimAndSwap(
        uint256 _pid,
        address _outputToken,
        uint256 _amountOutMin,
        uint256 _deadline
    ) external whenNotPaused {
        require(!pauseStatus[PauseType.Claim], "Claiming is paused");
        require(_pid < totalPools, "Pool does not exist");
        require(address(uniswapRouter) != address(0), "Uniswap router not set");

        Pool storage pool = pools[_pid];
        User storage user = users[_pid][msg.sender];

        // 更新池奖励
        updatePool(_pid);

        // 计算待领取的奖励
        uint256 pending = (user.stAmount * pool.accMetaNodePerST) / 1e18 - user.finishedMetaNode;
        user.pendingMetaNode += pending;
        user.finishedMetaNode = (user.stAmount * pool.accMetaNodePerST) / 1e18;

        require(user.pendingMetaNode > 0, "No reward to claim");

        uint256 claimAmount = user.pendingMetaNode;
        user.pendingMetaNode = 0;

        // 构建交换路径
        address[] memory path;
        if (_outputToken == address(0)) {
            // 交换成ETH
            path = new address[](2);
            path[0] = address(metaNodeToken);
            path[1] = uniswapRouter.WETH();
        } else {
            // 交换成其他ERC20代币
            path = new address[](3);
            path[0] = address(metaNodeToken);
            path[1] = uniswapRouter.WETH();
            path[2] = _outputToken;
        }

        // 授权Uniswap Router使用MetaNode代币
        // 先设置为0，再设置新值（防止某些代币需要先设置为0）
        uint256 currentAllowance = metaNodeToken.allowance(address(this), address(uniswapRouter));
        if (currentAllowance != 0) {
            // 如果当前授权不为0，先设置为0
            IERC20(address(metaNodeToken)).approve(address(uniswapRouter), 0);
        }
        // 设置新的授权
        IERC20(address(metaNodeToken)).approve(address(uniswapRouter), claimAmount);

        uint256[] memory amounts;
        if (_outputToken == address(0)) {
            // 交换成ETH
            amounts = uniswapRouter.swapExactTokensForETH(
                claimAmount,
                _amountOutMin,
                path,
                msg.sender,
                _deadline
            );
        } else {
            // 交换成其他ERC20代币
            amounts = uniswapRouter.swapExactTokensForTokens(
                claimAmount,
                _amountOutMin,
                path,
                msg.sender,
                _deadline
            );
        }

        uint256 outputAmount = _outputToken == address(0) ? amounts[amounts.length - 1] : amounts[amounts.length - 1];
        
        emit Claimed(msg.sender, _pid, claimAmount);
        emit ClaimedAndSwapped(msg.sender, _pid, claimAmount, _outputToken, outputAmount);
    }

    /**
     * @dev 获取通过Uniswap交换的预估输出数量
     * @param _amountIn 输入数量（MetaNode代币）
     * @param _outputToken 输出代币地址（address(0)表示ETH）
     * @return 预估的输出数量
     */
    function getSwapAmountOut(uint256 _amountIn, address _outputToken) external view returns (uint256) {
        if (address(uniswapRouter) == address(0)) {
            return 0;
        }
        
        address[] memory path;
        if (_outputToken == address(0)) {
            // 交换成ETH
            path = new address[](2);
            path[0] = address(metaNodeToken);
            path[1] = uniswapRouter.WETH();
        } else {
            // 交换成其他ERC20代币
            path = new address[](3);
            path[0] = address(metaNodeToken);
            path[1] = uniswapRouter.WETH();
            path[2] = _outputToken;
        }

        try uniswapRouter.getAmountsOut(_amountIn, path) returns (uint256[] memory amounts) {
            return amounts[amounts.length - 1];
        } catch {
            return 0;
        }
    }

    /**
     * @dev 获取用户待领取的奖励
     * @param _pid 池ID
     * @param _user 用户地址
     * @return 待领取的奖励数量
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        require(_pid < totalPools, "Pool does not exist");
        
        Pool memory pool = pools[_pid];
        User memory user = users[_pid][_user];

        uint256 accMetaNodePerST = pool.accMetaNodePerST;
        if (block.number > pool.lastRewardBlock && pool.stakeTokenAmount > 0) {
            // 计算总权重
            uint256 totalWeight = 0;
            for (uint256 i = 0; i < totalPools; i++) {
                totalWeight += pools[i].poolWeight;
            }

            if (totalWeight > 0) {
                uint256 blocks = block.number - pool.lastRewardBlock;
                uint256 poolReward = (blocks * metaNodePerBlock * pool.poolWeight) / totalWeight;
                accMetaNodePerST += (poolReward * 1e18) / pool.stakeTokenAmount;
            }
        }

        uint256 pending = (user.stAmount * accMetaNodePerST) / 1e18 - user.finishedMetaNode;
        return user.pendingMetaNode + pending;
    }

    /**
     * @dev 获取用户的解质押请求数量
     * @param _pid 池ID
     * @param _user 用户地址
     * @return 请求数量
     */
    function getUserRequestCount(uint256 _pid, address _user) external view returns (uint256) {
        return users[_pid][_user].requests.length;
    }

    /**
     * @dev 获取用户的解质押请求
     * @param _pid 池ID
     * @param _user 用户地址
     * @param _index 请求索引
     * @return 解质押请求
     */
    function getUserRequest(uint256 _pid, address _user, uint256 _index) external view returns (UnstakeRequest memory) {
        return users[_pid][_user].requests[_index];
    }

    /**
     * @dev 紧急提取（仅管理员，用于紧急情况）
     * @param _token 代币地址（address(0)表示native currency）
     * @param _to 接收地址
     * @param _amount 提取数量
     */
    function emergencyWithdraw(address _token, address _to, uint256 _amount) external onlyRole(ADMIN_ROLE) {
        if (_token == address(0)) {
            (bool success, ) = payable(_to).call{value: _amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(_token).safeTransfer(_to, _amount);
        }
    }

    // 接收ETH
    receive() external payable {}
}


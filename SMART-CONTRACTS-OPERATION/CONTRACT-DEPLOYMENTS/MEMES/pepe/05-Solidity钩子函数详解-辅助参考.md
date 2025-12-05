# 钩子函数(Hook Function)详解

## 一、什么是钩子函数？

- **定义: 钩子函数(Hook Function)**是在特定时机**自动调用**的函数,用于在核心逻辑执行前后插入自定义代码.
- **关键特征**：
  - **1.自动调用**：不需要显式调用,在特定时机自动执行
  - **2.可扩展性**：子合约可以重写钩子函数来添加自定义逻辑
  - **3.模板方法模式**：父合约定义框架,子合约实现细节



## 二、钩子函数的设计模式

### 2.1.模板方法模式(Template Method Pattern)

```solidity
// 父合约：定义框架
contract Parent {
    function coreFunction() internal {
        beforeHook();      // 钩子函数：执行前
        doCoreLogic();     // 核心逻辑
        afterHook();       // 钩子函数：执行后
    }
    
    function beforeHook() internal virtual {
        // 空实现,子合约可以重写
    }
    
    function afterHook() internal virtual {
        // 空实现,子合约可以重写
    }
}

// 子合约：实现细节
contract Child is Parent {
    function beforeHook() internal override {
        // 自定义的前置逻辑
        require(condition, "Check failed");
    }
}
```



## 三、`ERC20`中的钩子函数

### 3.1.`_beforeTokenTransfer` - 转账前钩子

```solidity
// ERC20.sol 第348行
function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
) internal virtual {
    // 空实现,子合约可以重写
}
```

- **调用时机**：

  - 在每次转账前自动调用
  - 在铸造(`mint`)前调用
  - 在销毁(`burn`)前调用

  

- **调用位置**：

```solidity
// ERC20.sol 第226行 - 转账时
function _transfer(address from, address to, uint256 amount) internal virtual {
    require(from != address(0), "ERC20: transfer from the zero address");
    require(to != address(0), "ERC20: transfer to the zero address");
    
    _beforeTokenTransfer(from, to, amount);  // ← 钩子函数调用
    
    // 转账逻辑
    uint256 fromBalance = _balances[from];
    // ...
}

// ERC20.sol 第254行 - 铸造时
function _mint(address account, uint256 amount) internal virtual {
    require(account != address(0), "ERC20: mint to the zero address");
    
    _beforeTokenTransfer(address(0), account, amount);  // ← 钩子函数调用
    
    _totalSupply += amount;
    _balances[account] += amount;
    // ...
}

// ERC20.sol 第280行 - 销毁时
function _burn(address account, uint256 amount) internal virtual {
    require(account != address(0), "ERC20: burn from the zero address");
    
    _beforeTokenTransfer(account, address(0), amount);  // ← 钩子函数调用
    
    uint256 accountBalance = _balances[account];
    // ...
}
```



### 3.2.`_afterTokenTransfer` - 转账后钩子

```solidity
// ERC20.sol 第364行
function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
) internal virtual {
    // 空实现,子合约可以重写
}
```

- **调用时机**：

  - 在每次转账后自动调用
  - 在铸造(`mint`)后调用
  - 在销毁(`burn`)后调用

  

- **调用位置**：

```solidity
function _transfer(...) internal virtual {
    // 转账逻辑
    _balances[from] -= amount;
    _balances[to] += amount;
    
    emit Transfer(from, to, amount);
    
    _afterTokenTransfer(from, to, amount);  // ← 钩子函数调用
}
```





## 四、`PEPE`合约中的钩子函数应用

### 4.1.重写 `_beforeTokenTransfer`

```solidity
// PEPE.sol 第29-44行
function _beforeTokenTransfer(
    address from,   // 发送方
    address to,     // 接收方
    uint256 amount  // 转账数量
) override internal virtual {
    // 1. 检查黑名单
    require(!blacklists[to] && !blacklists[from], "Blacklisted");
    
    // 2. 检查交易是否开始
    if (uniswapV2Pair == address(0)) {
        require(from == owner() || to == owner(), "trading is not started");
        return;
    }
    
    // 3. 检查持币限制
    if (limited && from == uniswapV2Pair) {
        require(
            super.balanceOf(to) + amount <= maxHoldingAmount && 
            super.balanceOf(to) + amount >= minHoldingAmount, 
            "Forbid"
        );
    }
}
```



### 4.2.执行流程

```
用户调用 transfer(recipient, amount)
  ↓
ERC20.transfer() 被调用
  ↓
ERC20._transfer() 被调用
  ↓
执行 PEPE._beforeTokenTransfer()(重写的钩子函数)
  - 检查黑名单
  - 检查交易是否开始
  - 检查持币限制
  ↓
如果所有检查通过,继续执行转账逻辑
  ↓
更新余额
  ↓
触发 Transfer 事件
  ↓
执行 _afterTokenTransfer()(如果有重写)
```



## 五、钩子函数的优势

### 5.1.不修改父合约代码

```solidity
// 不好的方式：直接修改 ERC20 合约
contract ERC20 {
    function _transfer(...) internal {
        // 添加黑名单检查(修改了 OpenZeppelin 代码)
        require(!blacklists[to], "Blacklisted");
        // ...
    }
}

// 好的方式：使用钩子函数
contract PEPE is ERC20 {
    function _beforeTokenTransfer(...) override internal virtual {
        require(!blacklists[to], "Blacklisted");  // 不修改父合约
    }
}
```



### 5.2.可扩展性

```solidity
// 基础功能
contract BasicToken is ERC20 {
    function _beforeTokenTransfer(...) override internal virtual {
        // 基础检查
    }
}

// 扩展功能
contract AdvancedToken is BasicToken {
    function _beforeTokenTransfer(...) override internal virtual {
        super._beforeTokenTransfer(...);  // 先执行父合约逻辑
        // 添加额外检查
    }
}
```



### 5.3.代码复用

```solidity
// 多个合约可以共享相同的钩子逻辑
contract TokenA is ERC20 {
    function _beforeTokenTransfer(...) override internal virtual {
        // 共享的检查逻辑
    }
}

contract TokenB is ERC20 {
    function _beforeTokenTransfer(...) override internal virtual {
        // 相同的检查逻辑
    }
}
```



## 六、钩子函数的类型

### 6.1.前置钩子(Before Hook)

- **特点**：在核心逻辑执行前调用

```solidity
function _beforeTokenTransfer(...) internal virtual {
    // 前置检查
    require(condition, "Check failed");
    // 核心逻辑会在之后执行
}
```

- **用途**：
  - 权限检查
  - 参数验证
  - 状态检查
  - 黑名单检查



### 6.2.后置钩子(After Hook)

- **特点**：在核心逻辑执行后调用

```solidity
function _afterTokenTransfer(...) internal virtual {
    // 核心逻辑已经执行完成
    // 可以执行后置处理
    emit CustomEvent();
    updateStatistics();
}
```

- **用途**：
  - 触发额外事件
  - 更新统计数据
  - 记录日志
  - 执行清理操作



### 6.3.条件钩子(Conditional Hook)

- **特点**：根据条件决定是否执行

```solidity
function _beforeTokenTransfer(...) override internal virtual {
    if (someCondition) {
        // 只在特定条件下执行
        doSomething();
    }
}
```



## 七、钩子函数`vs`修饰符

### 7.1.对比

| 特性 | 钩子函数 | 修饰符 |
|------|---------|--------|
| **调用方式** | 自动调用(在特定时机) | 手动应用(通过修饰符) |
| **位置** | 函数内部调用 | 函数声明处 |
| **参数** | 可以有参数 | 通过函数参数传递 |
| **可见性** | 通常是 `internal` | 可以是任何可见性 |
| **使用场景** | 核心逻辑的前后处理 | 权限检查、验证 |



### 7.2.实际例子对比

#### A.使用修饰符

```solidity
modifier onlyOwner() {
    require(msg.sender == owner(), "Not owner");
    _;
}

function setValue(uint256 value) external onlyOwner {
    // 函数体
}
```



#### A.使用钩子函数

```solidity
function _beforeTokenTransfer(...) override internal virtual {
    require(!blacklists[to], "Blacklisted");
}

function transfer(...) external {
    // _beforeTokenTransfer 会自动调用
}
```





## 八、`Solidity`中所有钩子函数详解

### 8.1.`ERC20`钩子函数

#### 8.1.1.`_beforeTokenTransfer` - 转账前钩子

- **函数签名**：

```solidity
function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
) internal virtual {}
```

- **表现形式**：

  - **命名规则**：`_before` + 操作名称
  - **可见性**：`internal`(只能内部调用)
  - **修饰符**：`virtual`(允许子合约重写)
  - **参数**：
    - `from`: 发送方地址(铸造时为 `address(0)`)
    - `to`: 接收方地址(销毁时为 `address(0)`)
    - `amount`: 转账数量

- **调用时机**：

  -  `_transfer()` 执行前
  -  `_mint()` 执行前
  -  `_burn()` 执行

  

- **简单示例**：

```solidity
contract MyToken is ERC20 {
    mapping(address => bool) public blacklist;
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) override internal virtual {
        require(!blacklist[from] && !blacklist[to], "Blacklisted");
    }
}
```



#### 8.1.2.`_afterTokenTransfer` - 转账后钩子

- **函数签名**：

```solidity
function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
) internal virtual {}
```

- **表现形式**：
  - **命名规则**：`_after` + 操作名称
  - **可见性**：`internal`
  - **修饰符**：`virtual`
  - **参数**：与 `_beforeTokenTransfer` 相同
- **调用时机**：
  - `_transfer()` 执行后
  -  `_mint()` 执行后
  -  `_burn()` 执行后



- **简单示例**：

```solidity
contract MyToken is ERC20 {
    mapping(address => uint256) public transferCount;
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) override internal virtual {
        transferCount[from]++;
        transferCount[to]++;
        emit TransferCompleted(from, to, amount);
    }
    
    event TransferCompleted(address indexed from, address indexed to, uint256 amount);
}
```



### 8.2.`ERC721`钩子函数

#### 8.2.1.`_beforeTokenTransfer` - 转账前钩子

- **函数签名**：

```solidity
function _beforeTokenTransfer(
    address from,
    address to,
    uint256 firstTokenId,
    uint256 batchSize
) internal virtual {}
```

- **表现形式**：
  - **命名规则**：`_before` + 操作名称
  - **可见性**：`internal`
  - **修饰符**：`virtual`
  - **参数**：
    - `from`: 发送方地址(铸造时为 `address(0)`)
    - `to`: 接收方地址(销毁时为 `address(0)`)
    - `firstTokenId`: 第一个代币 ID(批量操作时)
    - `batchSize`: 批量大小(单个操作时为 1)

- **调用时机**：
  - `_transfer()` 执行前
  - `_mint()` 执行前
  - `_burn()` 执行前
  -  `_safeTransfer()` 执行前
  -  `_safeMint()` 执行前




- **简单示例**：

```solidity
contract MyNFT is ERC721 {
    mapping(uint256 => bool) public locked;
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) override internal virtual {
        require(!locked[firstTokenId], "Token is locked");
    }
    
    function lockToken(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        locked[tokenId] = true;
    }
}
```



#### 8.2.2.`_afterTokenTransfer` - 转账后钩子

- **函数签名**：

```solidity
function _afterTokenTransfer(
    address from,
    address to,
    uint256 firstTokenId,
    uint256 batchSize
) internal virtual {}
```

- **表现形式**：
  - **命名规则**：`_after` + 操作名称
  - **可见性**：`internal`
  - **修饰符**：`virtual`
  - **参数**：与 `_beforeTokenTransfer` 相同

- **调用时机**：
  -  `_transfer()` 执行后
  - `_mint()` 执行后
  - `_burn()` 执行后
  -  `_safeTransfer()` 执行后
  -  `_safeMint()` 执行后




- **简单示例**：

```solidity
contract MyNFT is ERC721 {
    mapping(address => uint256) public ownershipCount;
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) override internal virtual {
        if (from != address(0)) {
            ownershipCount[from]--;
        }
        if (to != address(0)) {
            ownershipCount[to]++;
        }
    }
}
```



### 8.3.`ERC1155`钩子函数

#### 8.3.1.`_beforeTokenTransfer` - 转账前钩子

- **函数签名**：

```solidity
function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
) internal virtual {}
```

- **表现形式**：
  - **命名规则**：`_before` + 操作名称
  - **可见性**：`internal`
  - **修饰符**：`virtual`
  - **参数**：
    - `operator`: 执行操作的地址
    - `from`: 发送方地址(铸造时为 `address(0)`)
    - `to`: 接收方地址(销毁时为 `address(0)`)
    - `ids`: 代币`ID`数组
    - `amounts`: 数量数组
    - `data`: 附加数据

- **调用时机**：
  -  `_safeTransferFrom()` 执行前
  -  `_safeBatchTransferFrom()` 执行前
  -  `_mint()` 执行前
  - `_mintBatch()` 执行前
  - `_burn()` 执行前
  - `_burnBatch()` 执行前



- **简单示例**：

```solidity
contract MyMultiToken is ERC1155 {
    mapping(uint256 => bool) public paused;
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) override internal virtual {
        for (uint256 i = 0; i < ids.length; i++) {
            require(!paused[ids[i]], "Token paused");
        }
    }
}
```



#### 8.3.2.`_afterTokenTransfer` - 转账后钩子

- **函数签名**：

```solidity
function _afterTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
) internal virtual {}
```

- **表现形式**：

  - **命名规则**：`_after` + 操作名称
  - **可见性**：`internal`
  - **修饰符**：`virtual`
  - **参数**：与 `_beforeTokenTransfer` 相同

- **调用时机**

  -  `_safeTransferFrom()` 执行后
  -  `_safeBatchTransferFrom()` 执行后
  -  `_mint()` 执行后
  -  `_mintBatch()` 执行后
  -  `_burn()` 执行后
  -  `_burnBatch()` 执行后

  

- **简单示例**：

```solidity
contract MyMultiToken is ERC1155 {
    mapping(address => mapping(uint256 => uint256)) public totalReceived;
    
    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) override internal virtual {
        for (uint256 i = 0; i < ids.length; i++) {
            if (to != address(0)) {
                totalReceived[to][ids[i]] += amounts[i];
            }
        }
    }
}
```



### 8.4.其他钩子函数

#### 8.4.1.`TimelockController`钩子函数

**`_beforeCall` - 调用前钩子**

- **函数签名**：

```solidity
function _beforeCall(bytes32 id, bytes32 predecessor) private view {
    // 检查前置操作是否完成
}
```

- **表现形式**：
  - **命名规则**：`_before` + 操作名称
  - **可见性**：`private`(仅内部使用)
  - **修饰符**：`view`(只读)

- **调用时机**：
  - `execute()` 执行前
  -  `executeBatch()` 执行前




**`_afterCall` - 调用后钩子**

- **函数签名**：

```solidity
function _afterCall(bytes32 id) private {
    // 标记操作已完成
}
```

- **表现形式**：
  - **命名规则**：`_after` + 操作名称
  - **可见性**：`private`
  - **修饰符**：无

- **调用时机**：
  -  `execute()` 执行后
  -  `executeBatch()` 执行后




### 8.5.钩子函数命名规则总结

| 标准 | 钩子函数 | 参数特点 |
|------|---------|---------|
| **ERC20** | `_beforeTokenTransfer` | `(from, to, amount)` |
| | `_afterTokenTransfer` | `(from, to, amount)` |
| **ERC721** | `_beforeTokenTransfer` | `(from, to, firstTokenId, batchSize)` |
| | `_afterTokenTransfer` | `(from, to, firstTokenId, batchSize)` |
| **ERC1155** | `_beforeTokenTransfer` | `(operator, from, to, ids[], amounts[], data)` |
| | `_afterTokenTransfer` | `(operator, from, to, ids[], amounts[], data)` |

- **命名规律**：
  - 前缀：`_before` 或 `_after`
  - 操作名称：`TokenTransfer`(代币转账相关)
  - 可见性：`internal`(允许子合约调用)
  - 修饰符：`virtual`(允许子合约重写)



### 8.6.自定义钩子函数

```solidity
contract CustomContract {
    // 自定义前置钩子
    function _beforeAction() internal virtual {
        // 自定义前置逻辑
    }
    
    // 自定义后置钩子
    function _afterAction() internal virtual {
        // 自定义后置逻辑
    }
    
    // 核心函数使用钩子
    function doAction() internal {
        _beforeAction();  // 调用前置钩子
        // 核心逻辑
        _afterAction();   // 调用后置钩子
    }
}

// 子合约重写钩子
contract ChildContract is CustomContract {
    function _beforeAction() override internal virtual {
        super._beforeAction();  // 先执行父合约逻辑
        // 添加额外逻辑
        require(condition, "Check failed");
    }
}
```



## 九、钩子函数的最佳实践

### 9.1.使用`virtual`关键字

```solidity
function _beforeTokenTransfer(...) internal virtual {
    // virtual 允许子合约重写
}
```



### 9.2.使用`override`关键字

```solidity
function _beforeTokenTransfer(...) override internal virtual {
    // override 明确表示重写父合约函数
}
```



### 9.3.调用父合约钩子(如果需要)

```solidity
function _beforeTokenTransfer(...) override internal virtual {
    super._beforeTokenTransfer(...);  // 先执行父合约逻辑
    // 再执行子合约逻辑
    require(!blacklists[to], "Blacklisted");
}
```



### 9.4.保持钩子函数简洁

```solidity
// 好的做法：钩子函数只做检查
function _beforeTokenTransfer(...) override internal virtual {
    require(condition, "Check failed");
}

// 不好的做法：钩子函数包含复杂逻辑
function _beforeTokenTransfer(...) override internal virtual {
    // 复杂的业务逻辑(应该放在主函数中)
    complexCalculation();
    multipleDatabaseQueries();
}
```



## 十、`PEPE`合约中的钩子函数详解

### 10.1.完整的执行流程

```solidity
// 用户调用
transfer(recipient, 1000)
  ↓
// ERC20.transfer()(公开函数)
function transfer(address to, uint256 amount) external returns (bool) {
    _transfer(_msgSender(), to, amount);
    return true;
}
  ↓
// ERC20._transfer()(内部函数)
function _transfer(address from, address to, uint256 amount) internal virtual {
    require(from != address(0), "ERC20: transfer from the zero address");
    require(to != address(0), "ERC20: transfer to the zero address");
    
    _beforeTokenTransfer(from, to, amount);  // ← 钩子函数调用
    // from = msg.sender
    // to = recipient
    // amount = 1000
  ↓
    // PEPE._beforeTokenTransfer()(重写的版本)
    // 第1步：检查黑名单
    require(!blacklists[recipient] && !blacklists[msg.sender], "Blacklisted");
    
    // 第2步：检查交易是否开始
    if (uniswapV2Pair == address(0)) {
        require(msg.sender == owner() || recipient == owner(), "trading is not started");
        return;
    }
    
    // 第3步：检查持币限制
    if (limited && msg.sender == uniswapV2Pair) {
        require(
            balanceOf(recipient) + 1000 <= maxHoldingAmount && 
            balanceOf(recipient) + 1000 >= minHoldingAmount, 
            "Forbid"
        );
    }
  ↓
  // 如果所有检查通过,继续执行转账逻辑
    uint256 fromBalance = _balances[from];
    require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
    
    unchecked {
        _balances[from] = fromBalance - amount;
        _balances[to] += amount;
    }
    
    emit Transfer(from, to, amount);
    
    _afterTokenTransfer(from, to, amount);  // ← 后置钩子函数(如果有)
}
```



### 10.2.钩子函数的作用

在`PEPE`合约中,`_beforeTokenTransfer` 钩子函数实现了：

- **1.黑名单检查**：防止黑名单地址参与交易
- **2.交易控制**：在交易对设置前,只允许 owner 交易
- **3.持币限制**：限制从交易对买入时的持币数量

这些功能**不需要修改**`OpenZeppelin`的`ERC20`代码,只需要重写钩子函数即可.



## 十一、钩子函数的注意事项

### 11.1.`Gas`消耗

```solidity
// 注意：钩子函数会增加 Gas 消耗
function _beforeTokenTransfer(...) override internal virtual {
    // 每次转账都会执行这些检查
    // 如果检查很复杂,Gas 消耗会增加
    complexCheck();
}
```



### 11.2.重入攻击

```solidity
// 注意：钩子函数中不要调用外部合约
function _beforeTokenTransfer(...) override internal virtual {
    externalContract.call(...);  // 危险！可能导致重入攻击
}
```



### 11.3.状态一致性

```solidity
// 好的做法：钩子函数只做检查,不修改状态
function _beforeTokenTransfer(...) override internal virtual {
    require(condition, "Check failed");
}

// 注意：在钩子函数中修改状态要谨慎
function _beforeTokenTransfer(...) override internal virtual {
    someState = newValue;  // 可能影响核心逻辑
}
```



## 十二、钩子函数完整列表总结

### 12.1.所有钩子函数一览表

| 标准/合约 | 钩子函数 | 函数签名 | 调用时机 | 参数特点 |
|----------|---------|---------|---------|---------|
| **ERC20** | `_beforeTokenTransfer` | `(address from, address to, uint256 amount)` | transfer/mint/burn 前 | 3个参数 |
| | `_afterTokenTransfer` | `(address from, address to, uint256 amount)` | transfer/mint/burn 后 | 3个参数 |
| **ERC721** | `_beforeTokenTransfer` | `(address from, address to, uint256 firstTokenId, uint256 batchSize)` | transfer/mint/burn 前 | 4个参数(支持批量) |
| | `_afterTokenTransfer` | `(address from, address to, uint256 firstTokenId, uint256 batchSize)` | transfer/mint/burn 后 | 4个参数(支持批量) |
| **ERC1155** | `_beforeTokenTransfer` | `(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data)` | transfer/mint/burn 前 | 6个参数(支持批量) |
| | `_afterTokenTransfer` | `(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data)` | transfer/mint/burn 后 | 6个参数(支持批量) |
| **TimelockController** | `_beforeCall` | `(bytes32 id, bytes32 predecessor)` | execute 前 | 2个参数 |
| | `_afterCall` | `(bytes32 id)` | execute 后 | 1个参数 |



### 12.2.钩子函数的表现形式

#### A.共同特征

- **1.命名规则**
  - 前缀：`_before` 或 `_after`
  - 操作名称：描述操作(如 `TokenTransfer`)
  - 下划线前缀：表示内部函数
- **2.可见性**：
  - 通常是 `internal`(允许子合约调用)
  - 少数是 `private`(仅内部使用,如 TimelockController)
- **3.修饰符**：
  - `virtual`：允许子合约重写
  - `view`：只读操作(如 `_beforeCall`)
- **4.实现方式**：
  - 默认空实现(`{}`)
  - 子合约可以重写添加逻辑



### 12.3.钩子函数调用时机对比

| 操作类型 | ERC20 | ERC721 | ERC1155 |
|---------|-------|--------|---------|
| **转账** | transfer | transferFrom | safeTransferFrom |
| **安全转账** | 不支持 | safeTransferFrom | safeTransferFrom |
| **铸造** | mint | mint | mint |
| **安全铸造** | 不支持 | safeMint | 不支持 |
| **批量铸造** | 不支持 | (batchSize > 1) | mintBatch |
| **销毁** | burn | burn | burn |
| **批量销毁** | 不支持 | 不支持 | burnBatch |



## 十三、实际应用示例

### 13.1.`ERC20`黑名单示例

```solidity
contract BlacklistToken is ERC20 {
    mapping(address => bool) public blacklist;
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) override internal virtual {
        require(!blacklist[from], "Sender blacklisted");
        require(!blacklist[to], "Recipient blacklisted");
    }
    
    function addToBlacklist(address account) external onlyOwner {
        blacklist[account] = true;
    }
}
```



### 13.2.`ERC721`锁定机制示例

```solidity
contract LockableNFT is ERC721 {
    mapping(uint256 => bool) public locked;
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) override internal virtual {
        require(!locked[firstTokenId], "Token is locked");
    }
    
    function lockToken(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        locked[tokenId] = true;
    }
    
    function unlockToken(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        locked[tokenId] = false;
    }
}
```



### 13.3.`ERC1155`暂停机制示例

```solidity
contract PausableMultiToken is ERC1155 {
    mapping(uint256 => bool) public paused;
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) override internal virtual {
        for (uint256 i = 0; i < ids.length; i++) {
            require(!paused[ids[i]], "Token paused");
        }
    }
    
    function pauseToken(uint256 id) external onlyOwner {
        paused[id] = true;
    }
    
    function unpauseToken(uint256 id) external onlyOwner {
        paused[id] = false;
    }
}
```



### 13.4.`ERC20`转账统计示例

```solidity
contract StatisticToken is ERC20 {
    mapping(address => uint256) public transferCount;
    mapping(address => uint256) public totalReceived;
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) override internal virtual {
        if (from != address(0)) {
            transferCount[from]++;
        }
        if (to != address(0)) {
            transferCount[to]++;
            totalReceived[to] += amount;
        }
    }
}
```



### 13.5.`ERC721`所有权历史记录示例

```solidity
contract HistoryNFT is ERC721 {
    struct OwnershipRecord {
        address owner;
        uint256 timestamp;
    }
    
    mapping(uint256 => OwnershipRecord[]) public ownershipHistory;
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) override internal virtual {
        ownershipHistory[firstTokenId].push(
            OwnershipRecord({
                owner: to,
                timestamp: block.timestamp
            })
        );
    }
}
```



## 十四、总结

### 14.1.钩子函数的核心概念

- **1.定义**：在特定时机自动调用的函数
- **2.目的**：在不修改父合约代码的情况下扩展功能
- **3.机制**：模板方法模式,父合约定义框架,子合约实现细节



### 14.2.钩子函数的优势

- **可扩展性**：子合约可以重写添加功能
- **代码复用**：多个合约可以共享钩子逻辑
- **不修改父合约**：保持`OpenZeppelin`代码不变
- **标准化**：遵循统一的命名和调用模式



### 14.3.钩子函数的使用场景

- 权限检查
- 参数验证
- 状态检查
- 黑名单检查
- 交易限制
- 事件记录
- 统计数据更新
- 历史记录



### 14.4.关键理解

钩子函数是`Solidity`中实现**可扩展性**和**代码复用**的重要机制,通过重写钩子函数,可以在不修改父合约代码的情况下,为合约添加自定义功能.



### 14.5.钩子函数完整列表

- **ERC20**：
  - `_beforeTokenTransfer(address from, address to, uint256 amount)`
  - `_afterTokenTransfer(address from, address to, uint256 amount)`
- **ERC721**：
  - `_beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize)`
  - `_afterTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize)`
- **ERC1155**：
  - `_beforeTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data)`
  - `_afterTokenTransfer(address operator, address from, address to, uint256[] ids, uint256[] amounts, bytes data)`
- **其他**：
  - `_beforeCall(bytes32 id, bytes32 predecessor)` (TimelockController)
  - `_afterCall(bytes32 id)` (TimelockController)



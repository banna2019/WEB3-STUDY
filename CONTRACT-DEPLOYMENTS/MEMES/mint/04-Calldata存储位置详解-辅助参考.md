## 1.核心答案

- **`Calldata`数据既不是内存中的,也不是链上永久存储的**
- **`Calldata`数据存储在交易数据(`Transaction Data`)中,只在交易执行期间存在.**



## 2.`Calldata`的本质

### 2.1.`Calldata`是什么？

- **`Calldata`**是`Solidity`中用于存储**外部函数参数**的特殊区域.

```
用户发起交易
  ↓
交易数据(Transaction Data)包含：
  ├── 函数选择器(Function Selector)
  ├── 参数数据(Calldata)
  └── ETH 值(如果有)
  ↓
交易被打包到区块
  ↓
矿工/验证者执行交易
  ↓
函数执行期间可以读取 Calldata
  ↓
交易执行完成
  ↓
Calldata 数据不再可访问(但交易数据永久保存在区块中)
```



### 2.2.`Calldata`的存储位置

```
区块链结构
  ├── 区块(Block)
  │     ├── 区块头
  │     ├── 交易列表
  │     │     ├── 交易 1
  │     │     │     ├── from: 发送者地址
  │     │     │     ├── to: 合约地址
  │     │     │     ├── data: 函数调用数据(包含 Calldata) ← 这里
  │     │     │     └── value: ETH 数量
  │     │     └── 交易 2
  │     └── ...
  └── ...
```

- **关键理解**：
  - `Calldata`数据包含在**交易数据**中
  - 交易数据永久保存在**区块**中
  - 但`Calldata`区域本身是**只读的临时区域**
  - 函数执行完成后,`Calldata`区域不再可访问



## 3.`Calldata vs Memory vs Storage`

### 3.1.存储位置对比

| 特性 | Calldata | Memory | Storage |
|------|----------|--------|---------|
| **物理位置** | 交易数据中 | EVM 内存 | 链上状态树 |
| **生命周期** | 交易执行期间 | 函数执行期间 | 合约生命周期 |
| **可修改** | 否(只读) | 是 | 是 |
| **持久化** | 是(在交易数据中) | 否 | 是(在状态树中) |
| **Gas 消耗** | 低(读取) | 中(读写) | 高(写入) |
| **访问方式** | 直接读取交易数据 | EVM 内存操作 | 状态树查询 |



### 3.2.详细说明

#### A.`Calldata`

```solidity
function mint(bytes32[] calldata proof, string calldata attributes) external {
    // proof 和 attributes 存储在交易数据的 Calldata 区域
    // 数据永久保存在区块中(作为交易数据的一部分)
    // 但 Calldata 区域本身是只读的临时区域
    // 函数执行完成后,无法再访问 Calldata 区域
}
```

- **特点**：
  - **数据永久保存**：作为交易数据的一部分,永久保存在区块中
  - **区域临时访问**：`Calldata`区域只在函数执行期间可访问
  - **只读**：不能修改`Calldata`中的数据



#### B.`Memory`

```solidity
function processData(string memory data) internal {
    // data 存储在 EVM 内存中
    // 数据不永久保存
    // 函数执行完成后自动释放
    // 可以修改
}
```

- **特点**：
  - **数据不永久保存**：函数执行完成后自动释放
  - **可修改**：可以修改`Memory`中的数据
  - **临时存储**：只在函数执行期间存在



#### C.`Storage`

```solidity
contract MyContract {
    string private _baseURI;  // 存储在 Storage 中
    
    function setBaseURI(string calldata baseURI) external {
        _baseURI = baseURI;  // 从 Calldata 复制到 Storage
        // _baseURI 永久保存在链上状态树中
    }
}
```

- **特点**：
  - **数据永久保存**：永久保存在链上状态树中
  - **可修改**：可以修改`Storage`中的数据
  - **高`Gas`消耗**：写入消耗大量`Gas`



## 4.`Calldata`数据的生命周期

### 4.1.完整生命周期

```
1. 用户调用函数
   ↓
2. 参数数据编码到交易数据中(Calldata)
   ↓
3. 交易发送到网络
   ↓
4. 交易被打包到区块
   ↓
5. 区块被挖出/验证
   ↓
6. 交易执行开始
   ↓
7. 函数可以读取 Calldata 数据 
   ↓
8. 函数执行完成
   ↓
9. Calldata 区域不再可访问 
   ↓
10. 但交易数据永久保存在区块中 
```



### 4.2.关键理解

**`Calldata`数据的双重性质**：

- **1.作为交易数据**：
  - 永久保存在区块中
  - 可以通过区块浏览器查看
  - 可以通过`RPC`节点查询历史交易
- **2.作为函数参数区域**：
  - 只在函数执行期间可访问
  - 函数执行完成后无法访问
  - 是只读的临时区域



## 5.实际例子

### 5.1.`mint`函数示例

```solidity
function mint(bytes32[] calldata proof, string calldata initialAttributes) 
    external 
    payable 
{
    // proof 和 initialAttributes 存储在 Calldata 中
    // 1. 数据来源：交易数据中的 Calldata 区域
    // 2. 访问方式：直接读取,不复制
    // 3. 生命周期：只在函数执行期间可访问
    // 4. 持久化：交易数据永久保存在区块中
    
    if(bytes(initialAttributes).length > 0) {
        _tokenAttributes[tokenId] = initialAttributes;
        // ↑ 这里将 Calldata 中的数据复制到 Storage
        // Storage 中的数据会永久保存
    }
}
```



- **执行流程**：

```
用户调用: mint(proof, "attributes")
  ↓
交易数据包含：
  - 函数选择器: 0x1234...
  - proof: [0xABC..., 0xDEF...]
  - initialAttributes: "attributes"
  ↓
交易被打包到区块
  ↓
函数执行：
  - 读取 Calldata 中的 proof 
  - 读取 Calldata 中的 initialAttributes 
  - 将 initialAttributes 复制到 Storage 
  ↓
函数执行完成
  ↓
Calldata 区域不再可访问 
  ↓
但交易数据永久保存在区块中 
Storage 中的数据永久保存 
```



## 6.如何查看`Calldata`数据？

### 6.1.通过区块浏览器

```
1. 打开 Etherscan/BscScan
2. 输入交易哈希
3. 查看 "Input Data" 部分
4. 可以看到完整的 Calldata 数据(包括函数选择器和参数)
```



### 6.2.通过`RPC`节点

```javascript
// 使用 ethers.js
const tx = await provider.getTransaction(txHash);
console.log("Calldata:", tx.data);
// 输出: 0x1234... (包含函数选择器和参数编码)
```



### 6.3.在合约中读取

```solidity
function getCalldata() external pure returns (bytes memory) {
    // 无法直接读取 Calldata,但可以通过 msg.data 访问
    return msg.data;  // 返回完整的调用数据(包括函数选择器)
}
```



## 7.`Calldata`数据的持久化

### 7.1.数据是否永久保存？

- **答案：是的,但需要区分两个概念**



#### A.概念1：交易数据永久保存

```
交易数据(包含 Calldata)
  ↓
打包到区块
  ↓
区块被挖出
  ↓
区块添加到区块链
  ↓
交易数据永久保存 
```

- **特点**：
  - 交易数据永久保存在区块中
  - 可以通过区块浏览器查看
  - 可以通过`RPC`节点查询



#### B.概念2：`Calldata`区域临时访问

```
函数执行
  ↓
可以访问 Calldata 区域 
  ↓
函数执行完成
  ↓
Calldata 区域不再可访问 
```

- **特点**：
  - 只在函数执行期间可访问
  - 函数执行完成后无法访问
  - 是只读的临时区域



### 7.2.关键区别

| 方面 | 交易数据 | Calldata 区域 |
|------|---------|--------------|
| **持久化** | 永久保存 | 临时访问 |
| **存储位置** | 区块中 | 交易数据中 |
| **可访问性** | 永久可查询 | 只在执行期间 |
| **修改性** | 不可修改 | 只读 |



## 8.总结

### 8.1.核心答案

**`Calldata`返回的数据既不是内存中的,也不是链上永久存储的.**

- **准确说法**：
  - **`Calldata`数据存储在交易数据中**
  - **交易数据永久保存在区块中**
  - **但`Calldata`区域本身是只读的临时区域**
  - **函数执行完成后,`Calldata`区域不再可访问**



### 8.2.关键理解

- **1.`Calldata`数据的双重性质**：
  - 作为交易数据：永久保存在区块中
  - 作为函数参数区域：只在执行期间可访问
- **2.与其他存储位置的区别**：
  - **Memory**：临时内存,不永久保存
  - **Storage**：链上状态树,永久保存
  - **Calldata**：交易数据中,永久保存(但区域临时访问)
- **3.持久化方式**：
  - 如果需要永久保存`Calldata`中的数据,需要将其复制到`Storage`
  - 交易数据本身已经永久保存在区块中



### 8.3.重要结论

**`Calldata`数据作为交易数据的一部分永久保存在区块中,但`Calldata`区域本身只在函数执行期间可访问.如果需要永久保存`Calldata`中的数据,需要将其复制到`Storage`.**



## 9.相关概念

- **交易数据(Transaction Data)**：包含函数调用信息的完整数据
- **函数选择器(Function Selector)**：4字节的函数标识符
- **区块(Block)**：包含多个交易的区块
- **状态树(State Tree)**：存储合约状态的树结构
- **EVM 内存(EVM Memory)**：临时内存区域


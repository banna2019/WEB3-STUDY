## 1.什么是`Assembly`？

### 1.1.定义

**`Assembly`(内联汇编)**是`Solidity`中直接编写`EVM`(以太坊虚拟机)操作码的方式,允许开发者进行底层操作和`Gas`优化.



### 1.2.特点

- **底层控制**：直接操作`EVM`操作码
- **Gas 优化**：可以编写更高效的代码
- **灵活性**：绕过`Solidity`的一些限制
- **风险**：需要深入理解`EVM`,容易出错
- **可读性**：代码可读性较差



## 2.`Assembly`的基本语法

### 2.1.基本结构

```solidity
assembly {
    // EVM 操作码
    // 直接操作内存、存储、栈等
}
```



### 2.2.注释标记

```solidity
/// @solidity memory-safe-assembly
assembly {
    // 表示这是内存安全的汇编代码
}
```

- **说明**：
  - `@solidity memory-safe-assembly` 是`Solidity`编译器的注释标记
  - 表示这段汇编代码是内存安全的
  - 编译器会进行额外的安全检查



## 3.`ERC721.sol`中的实际例子

### 3.1.代码位置

```solidity
// ERC721.sol 第413-416行
catch (bytes memory reason) {
    if (reason.length == 0) {
        revert("ERC721: transfer to non ERC721Receiver implementer");
    } else {
        /// @solidity memory-safe-assembly
        assembly {
            revert(add(32, reason), mload(reason))
        }
    }
}
```



### 3.2.代码解析

#### A.上下文说明

> 这段代码在 `_checkOnERC721Received()` 函数中,用于处理外部合约调用失败的情况.

- **完整上下文**：

```solidity
function _checkOnERC721Received(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
) private returns (bool) {
    if (to.isContract()) {
        try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) 
            returns (bytes4 retval) {
            return retval == IERC721Receiver.onERC721Received.selector;
        } catch (bytes memory reason) {
            // reason 是错误信息(bytes 类型)
            if (reason.length == 0) {
                revert("ERC721: transfer to non ERC721Receiver implementer");
            } else {
                // 使用 assembly 重新抛出原始错误信息
                assembly {
                    revert(add(32, reason), mload(reason))
                }
            }
        }
    } else {
        return true;
    }
}
```



#### B.`Assembly`代码详解

```solidity
assembly {
    revert(add(32, reason), mload(reason))
}
```

- **逐行解析**：
  - **1.`reason`**：
    - 类型：`bytes memory`
    - 内容：外部合约调用失败的错误信息
    - 内存布局：`[长度(32字节)][数据...]`
  - **2.`add(32, reason)`**：
    - **操作**：计算 `reason + 32`
    - **含义**：跳过长度字段,指向实际数据
    - **原因**：`bytes memory` 的前32字节存储长度,实际数据从第33字节开始
  - **3.`mload(reason)`**：
    - **操作**：从内存位置 `reason` 读取32字节
    - **含义**：获取 `reason` 的长度
    - **结果**：返回 `reason.length`
  - **4.`revert(offset, length)`**：
    - **操作**：回滚交易并返回错误数据
    - **参数**：
      - `offset`：错误数据的起始位置(`add(32, reason)`)
      - `length`：错误数据的长度(`mload(reason)`)
    - **效果**：重新抛出原始错误信息



#### C.内存布局说明

```
reason (bytes memory) 的内存布局：
┌─────────────────┬──────────────────┐
│   长度(32字节)   │   实际数据        │
│   mload(reason) │   add(32,reason)  │
└─────────────────┴──────────────────┘
      ↑                    ↑
    reason 指针        数据起始位置
```

- **示例**：

```
reason = "Error message"
内存布局：
[0x000000000000000000000000000000000000000000000000000000000000000D][Error message]
│        长度 = 13 (0x0D)          ││    实际数据(13字节)    │
│         reason 指针指向这里      ││  add(32, reason)指向这里│
```



## 4.`Assembly`常用操作码

### 4.1.内存操作

| 操作码 | 说明 | 示例 |
|--------|------|------|
| **`mload(offset)`** | 从内存读取 32 字节 | `mload(0x40)` |
| **`mstore(offset, value)`** | 写入 32 字节到内存 | `mstore(0x40, 0x123)` |
| **`mstore8(offset, value)`** | 写入 1 字节到内存 | `mstore8(ptr, byte)` |
| **`msize()`** | 获取当前内存大小 | `msize()` |



### 4.2.存储操作

| 操作码 | 说明 | 示例 |
|--------|------|------|
| **`sload(slot)`** | 从存储读取 | `sload(0)` |
| **`sstore(slot, value)`** | 写入存储 | `sstore(0, 0x123)` |



### 4.3.算术运算

| 操作码 | 说明 | 示例 |
|--------|------|------|
| **`add(a, b)`** | 加法 | `add(1, 2)` → 3 |
| **`sub(a, b)`** | 减法 | `sub(5, 2)` → 3 |
| **`mul(a, b)`** | 乘法 | `mul(2, 3)` → 6 |
| **`div(a, b)`** | 除法 | `div(6, 2)` → 3 |
| **`mod(a, b)`** | 取模 | `mod(7, 3)` → 1 |



### 4.4.位运算

| 操作码 | 说明 | 示例 |
|--------|------|------|
| **`and(a, b)`** | 按位与 | `and(0xF0, 0x0F)` → 0x00 |
| **`or(a, b)`** | 按位或 | `or(0xF0, 0x0F)` → 0xFF |
| **`xor(a, b)`** | 按位异或 | `xor(0xF0, 0x0F)` → 0xFF |
| **`not(a)`** | 按位取反 | `not(0xFF)` → 0x00 |
| **`shl(shift, value)`** | 左移 | `shl(2, 1)` → 4 |
| **`shr(shift, value)`** | 右移 | `shr(2, 4)` → 1 |



### 4.5.比较操作

| 操作码 | 说明 | 示例 |
|--------|------|------|
| **`lt(a, b)`** | 小于 | `lt(1, 2)` → 1 (true) |
| **`gt(a, b)`** | 大于 | `gt(2, 1)` → 1 (true) |
| **`eq(a, b)`** | 等于 | `eq(1, 1)` → 1 (true) |
| **`iszero(value)`** | 是否为零 | `iszero(0)` → 1 (true) |



### 4.6.控制流

| 操作码 | 说明 | 示例 |
|--------|------|------|
| **`jump(label)`** | 跳转到标签 | `jump(end)` |
| **`jumpi(label, condition)`** | 条件跳转 | `jumpi(end, eq(x, 0))` |
| **`label:`** | 定义标签 | `end:` |
| **`revert(offset, length)`** | 回滚交易 | `revert(0x40, 32)` |
| **`return(offset, length)`** | 返回数据 | `return(0x40, 32)` |



## 5.`OpenZeppelin`中的`Assembly`示例

### 5.1.`Strings.sol`中的示例

#### A.示例1：获取字符串指针

```solidity
// Strings.sol 第24-27行
string memory buffer = new string(length);
uint256 ptr;
/// @solidity memory-safe-assembly
assembly {
    ptr := add(buffer, add(32, length))
}
```

- **解析**：
  - `buffer`：新创建的字符串(`memory`)
  - `ptr`：指向字符串数据的指针
  - `add(buffer, add(32, length))`：
    - `buffer`：字符串的起始位置
    - `add(32, length)`：跳过长度字段(32字节)和数据长度
    - 结果：指向字符串数据的末尾(用于反向写入)
- **内存布局**：

```
buffer 的内存布局：
┌──────────┬──────────────┬──────────────┐
│ 长度字段 │   数据区域    │   未使用区域 │
│ (32字节) │  (length字节) │              │
└──────────┴──────────────┴──────────────┘
   buffer        ptr 指向这里
```



#### B.示例2：写入单个字节

```solidity
// Strings.sol 第30-33行
ptr--;
/// @solidity memory-safe-assembly
assembly {
    mstore8(ptr, byte(mod(value, 10), _SYMBOLS))
}
```

- **解析**：
  - `ptr--`：指针向前移动 1 字节(反向写入)
  - `mstore8(ptr, value)`：写入 1 字节到内存
  - `byte(mod(value, 10), _SYMBOLS)`：
    - `mod(value, 10)`：获取 value 的个位数(0-9)
    - `byte(index, bytes)`：从 `_SYMBOLS` 字符串中获取对应字符
    - `_SYMBOLS = "0123456789abcdef"`
- **用途**：将数字转换为`ASCII`字符



### 5.2.`StorageSlot.sol`中的示例

#### A.示例：设置存储槽位

```solidity
// StorageSlot.sol 第63-66行
function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
    /// @solidity memory-safe-assembly
    assembly {
        r.slot := slot
    }
}
```

- **解析**：
  - `r.slot := slot`：将存储变量 `r` 的槽位设置为 `slot`
  - **用途**：实现可升级合约中的存储槽位管理
  - **效果**：可以访问任意存储槽位,避免存储冲突
- **使用示例**：

```solidity
bytes32 constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

AddressSlot storage implSlot = StorageSlot.getAddressSlot(IMPLEMENTATION_SLOT);
implSlot.value = newImplementation;  // 写入到指定槽位
```



## 6.`Assembly`的内存模型

### 6.1.`EVM`内存布局

```
内存布局(从 0x00 开始)：
┌─────────────┬────────────────────────────────────┐
│ 0x00 - 0x3F │ 临时空间(64字节,用于哈希和拷贝)    │
│ 0x40 - 0x5F │ 空闲内存指针(free memory pointer) │
│ 0x60 - ...  │ 可用内存区域                        │
└─────────────┴────────────────────────────────────┘
```



### 6.2.空闲内存指针

```solidity
assembly {
    let ptr := mload(0x40)  // 获取当前空闲内存指针
    // 使用内存...
    mstore(0x40, add(ptr, length))  // 更新空闲内存指针
}
```

- **说明**：
  - `0x40` 位置存储当前空闲内存的起始位置
  - 分配内存后需要更新这个指针
  - `Solidity`编译器会自动管理,但`assembly`中需要手动管理



## 7.`Assembly`中的变量

### 7.1.局部变量

```solidity
assembly {
    let x := 10        // 定义局部变量 x = 10
    let y := add(x, 5) // y = x + 5 = 15
    x := mul(x, 2)     // x = x * 2 = 20
}
```

- **特点**：
- `使用 `let` 关键字定义` 
-  `使用 `:=` 赋值` 
- 作用域仅在`assembly`块内



### 7.2.访问外部变量

```solidity
contract Example {
    uint256 public value = 100;
    
    function test() public {
        assembly {
            let x := sload(value.slot)  // 读取存储变量
            sstore(value.slot, 200)      // 写入存储变量
        }
    }
}
```

- **说明**：
  - `value.slot`：获取变量的存储槽位
  - `sload(slot)`：读取存储值
  - `sstore(slot, value)`：写入存储值



## 8.`ERC721.sol`中的`Assembly`详细解析

### 8.1.完整代码

```solidity
// ERC721.sol 第409-417行
catch (bytes memory reason) {
    if (reason.length == 0) {
        revert("ERC721: transfer to non ERC721Receiver implementer");
    } else {
        /// @solidity memory-safe-assembly
        assembly {
            revert(add(32, reason), mload(reason))
        }
    }
}
```



### 8.2.为什么使用`Assembly`？

#### A.问题：为什么不能直接`revert(reason)`？

- **原因**：
  - `Solidity`的 `revert(string)` 会重新编码字符串
  - 会丢失原始错误信息的格式
  - `Assembly`的 `revert()` 可以精确控制错误数据



#### B.对比

- **方式1：使用`Solidity revert`(不推荐)**

```solidity
catch (bytes memory reason) {
    revert(string(reason));  // 重新编码,可能丢失信息
}
```



- **方式2：使用Assembly revert(推荐)**

```solidity
catch (bytes memory reason) {
    assembly {
        revert(add(32, reason), mload(reason))  // 直接传递原始错误
    }
}
```

- **优势**：
  - 保留原始错误信息
  - 更高效(不重新编码)
  - `Gas`消耗更低



### 8.3.内存布局详解

#### A.`bytes memory`的内存布局

```
reason (bytes memory) 的内存表示：
┌────────────────────────────────────────────────────────────┐
│ 偏移量  │  内容              │  说明                        │
├─────────┼───────────────────┼────────────────────────────┤
│ +0      │ length (32字节)    │ reason.length                │
│ +32     │ data[0]            │ 第一个字节                   │
│ +33     │ data[1]            │ 第二个字节                   │
│ ...     │ ...                │ ...                         │
│ +32+n   │ data[n-1]          │ 最后一个字节                │
└─────────┴───────────────────┴──────────────────────────────┘
```



#### B.`Assembly`操作详解

```solidity
assembly {
    revert(add(32, reason), mload(reason))
}
```

- **步骤分解**：
  - **1.`reason`**：
    - 类型：`bytes memory` 的指针
    - 值：指向内存中`reason`的起始位置(例如：`0x80`)
  - **2.`mload(reason)`**：
    - 操作：从 `reason` 位置读取32字节
    - 结果：获取 `reason.length`(例如：13)
    - 内存位置：`reason + 0`(前32字节)
  - **3.`add(32, reason)`**：
    - 操作：计算 `reason + 32`
    - 结果：指向实际数据的起始位置(例如：`0x80 + 32 = 0xA0`)
    - 内存位置：`reason + 32`(跳过长度字段)
  - **4.`revert(offset, length)`**：
    - `offset`：`add(32, reason)` → 数据起始位置
    - `length`：`mload(reason)` → 数据长度
    - 效果：回滚并返回原始错误信息



## 9.`Assembly`的其他应用场景

### 9.1.`Gas`优化

```solidity
//  普通 Solidity 代码
function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;  // 消耗更多 Gas
}

// 使用 Assembly(仅示例,实际中加法不需要 assembly)
function add(uint256 a, uint256 b) public pure returns (uint256) {
    assembly {
        let result := add(a, b)
        mstore(0x40, result)
        return(0x40, 32)
    }
}
```



### 9.2.存储槽位操作

```solidity
// 访问特定存储槽位
function getStorageValue(bytes32 slot) public view returns (uint256) {
    assembly {
        let value := sload(slot)
        mstore(0x40, value)
        return(0x40, 32)
    }
}
```



### 9.3.内存操作

```solidity
// 高效的内存拷贝
function copyMemory(bytes memory data) public pure returns (bytes memory) {
    assembly {
        let length := mload(data)
        let result := mload(0x40)
        mstore(result, length)
        // 拷贝数据...
        mstore(0x40, add(result, add(32, length)))
        return(result, add(32, length))
    }
}
```



## 10.`Assembly`的注意事项

### 10.1.内存安全

#### A.内存安全的`Assembly`

```solidity
/// @solidity memory-safe-assembly
assembly {
    // 编译器会进行额外检查
    // 确保内存操作安全
}
```

- **特点**：
  - 编译器会检查内存安全性
  - 防止内存覆盖
  - 自动管理空闲内存指针



#### B.不安全的`Assembly`

```solidity
assembly {
    // 没有注释标记
    // 编译器不进行安全检查
    // 需要手动管理内存
}
```

- **风险**：
  - 可能覆盖其他内存区域
  - 可能导致数据损坏
  - 需要手动管理空闲内存指针



### 10.2.常见错误

#### A.错误1：内存覆盖

```solidity
//  错误：可能覆盖其他内存
assembly {
    mstore(0x00, value)  // 覆盖临时空间
}

// 正确：使用空闲内存指针
assembly {
    let ptr := mload(0x40)
    mstore(ptr, value)
    mstore(0x40, add(ptr, 32))
}
```



#### B.错误2：存储槽位冲突

```solidity
//  错误：可能覆盖其他存储
assembly {
    sstore(0, value)  // 可能覆盖其他变量
}

// 正确：使用明确的槽位
assembly {
    sstore(IMPLEMENTATION_SLOT, value)
}
```



## 11.`Assembly vs Solidity`对比

### 11.1.可读性

| 特性 | Solidity | Assembly |
|------|---------|----------|
| **可读性** | 高 | 低 |
| **语法** | 高级语言 | 低级操作码 |
| **理解难度** | 容易 | 困难 |



### 11.2.`Gas`消耗

| 操作 | Solidity | Assembly | 节省 |
|------|---------|----------|------|
| **简单运算** | 中等 | 低 | 10-20% |
| **内存操作** | 高 | 低 | 30-50% |
| **存储操作** | 高 | 低 | 5-10% |



### 11.3.使用建议

- **使用Assembly的场景**：
  - `Gas`优化至关重要
  - 需要底层内存操作
  - 需要精确控制存储布局
  - 实现复杂的数据结构
- **不使用Assembly的场景**：
  -  简单业务逻辑
  - 可读性优先
  - 团队缺乏`Assembly`经验
  - 安全性优先



## 12.最佳实践

### 12.1.使用内存安全标记

```solidity
/// @solidity memory-safe-assembly
assembly {
    // 让编译器进行安全检查
}
```



### 12.2.添加详细注释

```solidity
assembly {
    // 获取 reason 的长度
    let length := mload(reason)
    
    // 计算数据起始位置(跳过32字节长度字段)
    let dataPtr := add(32, reason)
    
    // 回滚并返回原始错误信息
    revert(dataPtr, length)
}
```



### 12.3.避免不必要的`Assembly`

```solidity
//  不必要：简单操作不需要assembly
function add(uint256 a, uint256 b) public pure returns (uint256) {
    assembly {
        let result := add(a, b)
        return(result, 32)
    }
}

// 推荐：使用 Solidity
function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b;
}
```



## 13.总结

### 13.1.`Assembly`的核心概念

- **1.定义**：直接编写`EVM`操作码的方式
- **2.用途**：底层操作和`Gas`优化
- **3.语法**：`assembly { ... }`
- **4.标记**：`@solidity memory-safe-assembly`



### 13.2.`ERC721.sol`中的`Assembly`

```solidity
assembly {
    revert(add(32, reason), mload(reason))
}
```

- **作用**：
  - 重新抛出原始错误信息
  - 跳过`bytes memory`的长度字段
  - 精确控制`revert`的数
- **解析**：
  - `mload(reason)`：获取`reason`的长度
  - `add(32, reason)`：指向实际数据的起始位置
  - `revert(offset, length)`：回滚并返回错误数据



### 13.3.关键理解

- `Assembly`提供底层控制能力
- 可以显著优化`Gas`消耗
- 需要深入理解`EVM`内存模型
- 使用不当可能导致严重错误
- 使用 `@solidity memory-safe-assembly` 标记提高安全性



## 14.相关代码位置

- **ERC721.sol**：第399-423行

```solidity
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.isContract()) {  // Meme/node_modules/@openzeppelin/contracts/utils/Address.sol
            // Meme/node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    /// @solidity memory-safe-assembly
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }
```



- **Strings.sol**：第19-39行

```solidity
    // 第19-39行
    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = Math.log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), _SYMBOLS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }
    
    

```



- **StorageSlot.sol**：第62-137行

```solidity
    function getAddressSlot(bytes32 slot) internal pure returns (AddressSlot storage r) {
        /// @solidity memory-safe-assembly
        assembly {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BooleanSlot` with member `value` located at `slot`.
     */
    function getBooleanSlot(bytes32 slot) internal pure returns (BooleanSlot storage r) {
        /// @solidity memory-safe-assembly
        assembly {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `Bytes32Slot` with member `value` located at `slot`.
     */
    function getBytes32Slot(bytes32 slot) internal pure returns (Bytes32Slot storage r) {
        /// @solidity memory-safe-assembly
        assembly {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `Uint256Slot` with member `value` located at `slot`.
     */
    function getUint256Slot(bytes32 slot) internal pure returns (Uint256Slot storage r) {
        /// @solidity memory-safe-assembly
        assembly {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` with member `value` located at `slot`.
     */
    function getStringSlot(bytes32 slot) internal pure returns (StringSlot storage r) {
        /// @solidity memory-safe-assembly
        assembly {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `StringSlot` representation of the string storage pointer `store`.
     */
    function getStringSlot(string storage store) internal pure returns (StringSlot storage r) {
        /// @solidity memory-safe-assembly
        assembly {
            r.slot := store.slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` with member `value` located at `slot`.
     */
    function getBytesSlot(bytes32 slot) internal pure returns (BytesSlot storage r) {
        /// @solidity memory-safe-assembly
        assembly {
            r.slot := slot
        }
    }

    /**
     * @dev Returns an `BytesSlot` representation of the bytes storage pointer `store`.
     */
    function getBytesSlot(bytes storage store) internal pure returns (BytesSlot storage r) {
        /// @solidity memory-safe-assembly
        assembly {
            r.slot := store.slot
        }
    }
```





## 15.相关概念

- **EVM(以太坊虚拟机)**：执行智能合约的虚拟机
- **操作码(Opcode)**：`EVM`的底层指令
- **内存(Memory)**：临时存储区域
- **存储(Storage)**：永久存储区域
- **Gas优化**：减少`Gas`消耗的技术



## 16.学习资源

- [Solidity Assembly 文档](https://docs.soliditylang.org/en/latest/assembly.html)
- [EVM 操作码参考](https://ethereum.org/en/developers/docs/evm/opcodes/)
- [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)


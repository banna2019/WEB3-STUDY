### 一、项目操作步骤

```bash
# 运行脚本创建项目
./init-solidity-project.sh [项目名称]

# 示例
./init-solidity-project.sh my-contract

# 进入项目并配置
cd my-contract
cp .env.example .env
# 编辑 .env 文件填写配置

# 检查配置
npm run check-config

# 编译和测试
npm run compile
npm test

# 部署
npm run deploy:sepolia
```



### 二、作业

#### 2.1.创建一个名为`Voting`的合约

- 包含如下功能:
  - 一个`mapping`来存储后选的得票数
  - 一个`vote`函数,允许用户投票给某个候选人
  - 一个`getVotes`函数,返回某个候选人的得票数
  - 一个`resetVotes`函数,重置所有候选人的得票数

- 代码路径: `SOLIDITY/SOLIDITY-BASE/Voting`
- 说明文档: `SOLIDITY/SOLIDITY-BASE/Voting/README.md`



## 2.2.反转字符串(`Reverse String`)

- 题目描述: 反转一个字符串.输入"abcde",输出"edcba"
- 代码路径: `SOLIDITY/SOLIDITY-BASE/StringReversal`
- 说明文档: `SOLIDITY/SOLIDITY-BASE/StringReversal/README.md`



#### 2.3.用`Solidity`实现整数转罗马数字

- 题目描述: https://leetcode.cn/problems/roman-to-integer/description/
- 代码路径: `SOLIDITY/SOLIDITY-BASE/RomanToInteger`
- 说明文档: `SOLIDITY/SOLIDITY-BASE/RomanToInteger/README.md`



#### 2.4.用`Solidity`实现罗马数字转整数

- 题目描述: https://leetcode.cn/problems/integer-to-roman/description/
- 代码路径: `SOLIDITY/SOLIDITY-BASE/IntegerToRoman`
- 说明文档: `SOLIDITY/SOLIDITY-BASE/IntegerToRoman/README.md`



#### 2.5.合并两个有序数组(`Merge Sorted Array`)

- 题目描述: 将两个有序数组合并为一个有序数组.
- 代码路径: `SOLIDITY/SOLIDITY-BASE/MergeSortedArrays`
- 说明文档: `SOLIDITY/SOLIDITY-BASE/MergeSortedArrays/README.md`



#### 2.6.二分查找(`Binary Search`)

- 题目描述: 在一个有序数组中查找目标值.
- 代码路径: `SOLIDITY/SOLIDITY-BASE/BinarySearch`
- 说明文档: `SOLIDITY/SOLIDITY-BASE/BinarySearch/README.md`




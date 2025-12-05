// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MetaNodeToken
 * @dev MetaNode代币合约，用作质押奖励代币
 */
contract MetaNodeToken is ERC20, Ownable {
    constructor(
        address initialOwner
    ) ERC20("MetaNode Token", "MNODE") Ownable(initialOwner) {
        // 可以在这里铸造初始代币给合约所有者
        // _mint(initialOwner, 1000000 * 10**decimals());
    }

    /**
     * @dev 铸造代币（仅所有者）
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev 批量铸造代币（仅所有者）
     * @param recipients 接收地址数组
     * @param amounts 铸造数量数组
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
}


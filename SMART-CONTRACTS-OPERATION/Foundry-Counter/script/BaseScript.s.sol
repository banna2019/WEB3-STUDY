// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";

abstract contract BaseScript is Script {
    address internal deployer;
    address internal user;
    string internal mnemonic;
    uint256 internal deployerPrivateKey;

    function setUp() public virtual {
        // 读取 PRIVATE_KEY 字符串，支持带或不带 0x 前缀
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        bytes memory privateKeyBytes = bytes(privateKeyStr);
        
        // 检查是否以 "0x" 开头
        bool hasPrefix = privateKeyBytes.length >= 2 && 
                         privateKeyBytes[0] == "0" && 
                         privateKeyBytes[1] == "x";
        
        // 如果没有 0x 前缀，添加它
        if (!hasPrefix) {
            privateKeyStr = string.concat("0x", privateKeyStr);
        }
        
        // 使用 vm.parseUint 直接解析十六进制字符串(避免使用不安全的 vm.setEnv)
        deployerPrivateKey = vm.parseUint(privateKeyStr);
        
    }


    function saveContract(string memory name, address addr) public {
        string memory chainId = vm.toString(block.chainid);
        
        string memory json1 = "key";
        string memory finalJson =  vm.serializeAddress(json1, "address", addr);
        string memory dirPath = string.concat(string.concat("deployments/", name), "_");
        vm.writeJson(finalJson, string.concat(dirPath, string.concat(chainId, ".json"))); 
    }

    modifier broadcaster() {
        vm.startBroadcast(deployerPrivateKey);
        _;
        vm.stopBroadcast();
    }
}

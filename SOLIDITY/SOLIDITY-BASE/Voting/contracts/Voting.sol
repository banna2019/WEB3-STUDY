// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title Voting
 * @dev 一个简单的投票合约，允许用户投票给候选人并查看得票数
 */
contract Voting {
    // 存储每个候选人的得票数
    mapping(string => uint256) public votes;
    
    // 存储已投票的地址，防止重复投票
    mapping(address => bool) public hasVoted;
    
    // 存储所有候选人的列表（用于重置功能）
    string[] private candidates;
    
    // 合约所有者（用于重置投票）
    address public owner;
    
    // 事件
    event Voted(address indexed voter, string candidate, uint256 newVoteCount);
    event VotesReset(address indexed resetter);
    
    // 修饰符：只有所有者可以调用
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // 构造函数
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev 投票给某个候选人
     * @param candidate 候选人的名称
     */
    function vote(string memory candidate) public {
        // 检查是否已经投过票
        require(!hasVoted[msg.sender], "You have already voted");
        
        // 检查候选人名称不能为空
        require(bytes(candidate).length > 0, "Candidate name cannot be empty");
        
        // 记录投票
        votes[candidate]++;
        hasVoted[msg.sender] = true;
        
        // 如果是新候选人，添加到列表中（用于重置功能）
        // 检查候选人是否已在列表中
        bool candidateExists = false;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (keccak256(bytes(candidates[i])) == keccak256(bytes(candidate))) {
                candidateExists = true;
                break;
            }
        }
        if (!candidateExists) {
            candidates.push(candidate);
        }
        
        // 触发事件
        emit Voted(msg.sender, candidate, votes[candidate]);
    }
    
    /**
     * @dev 获取某个候选人的得票数
     * @param candidate 候选人的名称
     * @return 该候选人的得票数
     */
    function getVotes(string memory candidate) public view returns (uint256) {
        return votes[candidate];
    }
    
    /**
     * @dev 重置所有候选人的得票数（只有所有者可以调用）
     */
    function resetVotes() public onlyOwner {
        // 遍历所有候选人并重置得票数
        for (uint256 i = 0; i < candidates.length; i++) {
            votes[candidates[i]] = 0;
        }
        
        // 触发事件
        emit VotesReset(msg.sender);
    }
    
    /**
     * @dev 重置指定候选人的得票数（辅助函数）
     * @param candidate 要重置的候选人名称
     */
    function resetCandidateVotes(string memory candidate) public onlyOwner {
        votes[candidate] = 0;
    }
    
    /**
     * @dev 获取候选人总数
     * @return 候选人总数
     */
    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }
    
    /**
     * @dev 获取指定索引的候选人名称
     * @param index 候选人索引
     * @return 候选人名称
     */
    function getCandidate(uint256 index) public view returns (string memory) {
        require(index < candidates.length, "Index out of bounds");
        return candidates[index];
    }
    
    /**
     * @dev 检查某个地址是否已投票
     * @param voter 投票者地址
     * @return 是否已投票
     */
    function checkHasVoted(address voter) public view returns (bool) {
        return hasVoted[voter];
    }
    
    /**
     * @dev 重置某个地址的投票状态（用于测试或特殊场景）
     * @param voter 要重置的投票者地址
     */
    function resetVoterStatus(address voter) public onlyOwner {
        hasVoted[voter] = false;
    }
    
    /**
     * @dev 重置所有投票者状态（只有所有者可以调用）
     * 注意：这个函数需要遍历所有可能的地址，实际中不可行
     * 这里提供一个受限的实现，需要明确指定要重置的地址
     */
    function resetAllVoterStatus(address[] memory voters) public onlyOwner {
        for (uint256 i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
        }
    }
}


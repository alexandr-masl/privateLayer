// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OracleBlockStorage is Ownable {
    // Structure to store block header information
    struct BlockHeader {
        uint256 blockNumber;
        bytes32 blockHash;
        bytes32 parentHash;
        bytes32 stateRoot;
        bytes32 transactionsRoot;
        bytes32 receiptsRoot;
        uint256 timestamp;
    }

    // Mapping to store block headers by block number
    mapping(uint256 => BlockHeader) public blockHeaders;

    // Mapping to store trusted oracles
    mapping(address => bool) public trustedOracles;

    // Modifier to restrict access to only trusted oracles
    modifier onlyTrustedOracle() {
        require(trustedOracles[msg.sender], "Not a trusted oracle");
        _;
    }

    constructor() Ownable(msg.sender) {}

    // Function to add a trusted oracle
    function addTrustedOracle(address _oracle) external onlyOwner {
        trustedOracles[_oracle] = true;
    }

    // Function to remove a trusted oracle
    function removeTrustedOracle(address _oracle) external onlyOwner {
        trustedOracles[_oracle] = false;
    }

    // Function to submit block header data
    function submitBlockHeader(
        uint256 blockNumber,
        bytes32 blockHash,
        bytes32 parentHash,
        bytes32 stateRoot,
        bytes32 transactionsRoot,
        bytes32 receiptsRoot,
        uint256 timestamp
    ) external onlyTrustedOracle {
        blockHeaders[blockNumber] = BlockHeader({
            blockNumber: blockNumber,
            blockHash: blockHash,
            parentHash: parentHash,
            stateRoot: stateRoot,
            transactionsRoot: transactionsRoot,
            receiptsRoot: receiptsRoot,
            timestamp: timestamp
        });
    }

    // Function to retrieve block header data by block number
    function getBlockHeader(uint256 blockNumber) external view returns (BlockHeader memory) {
        return blockHeaders[blockNumber];
    }
}

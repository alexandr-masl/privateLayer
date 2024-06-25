// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract OracleDepositStorage is Ownable {
    struct OracleSubmissionData {
        bytes32 merkleRoot;
        bytes32[] leaves;
    }

    mapping(bytes32 => mapping(address => OracleSubmissionData)) public oracleSubmissionsData;
    mapping(bytes32 => uint) public depositSubmissions;
    mapping(bytes32 => address[]) public submittingOracles;
    mapping(bytes32 => bytes32) public txHashToMerkleRoot;
    mapping(bytes32 => bytes32[]) public txHashToLeaves;

    mapping(address => bool) public trustedOracles;

    modifier onlyTrustedOracle() {
        require(trustedOracles[msg.sender], "Not a trusted oracle");
        _;
    }

    uint public oraclesAmount;

    event OracleCompromised(bytes32 indexed txHash);
    event DepositHeaderSubmitted(bytes32 indexed txHash, bytes32 merkleRoot);

    constructor() Ownable(msg.sender) {}

    function addTrustedOracle(address _oracle) external onlyOwner {
        oraclesAmount++;
        trustedOracles[_oracle] = true;
    }

    function removeTrustedOracle(address _oracle) external onlyOwner {
        oraclesAmount--;
        trustedOracles[_oracle] = false;
    }

    function submitDepositHeader(
        bytes32 _txHash,
        bytes32 _merkleRoot,
        bytes32[] calldata _leaves
    ) external onlyTrustedOracle {
        require(oracleSubmissionsData[_txHash][msg.sender].merkleRoot == bytes32(0), "Oracle has already submitted this deposit header");

        oracleSubmissionsData[_txHash][msg.sender] = OracleSubmissionData({
            merkleRoot: _merkleRoot,
            leaves: _leaves
        });

        depositSubmissions[_txHash]++;
        submittingOracles[_txHash].push(msg.sender);

        uint threshold = (oraclesAmount * 77) / 100;

        if (depositSubmissions[_txHash] >= threshold) {
            if (allOraclesSubmittedSameData(_txHash, _merkleRoot, _leaves)) {
                txHashToMerkleRoot[_txHash] = _merkleRoot;
                txHashToLeaves[_txHash] = _leaves;
                emit DepositHeaderSubmitted(_txHash, _merkleRoot);
            } else {
                handleCompromisedOracle(_txHash);
            }
        }
    }

    function allOraclesSubmittedSameData(
        bytes32 _txHash,
        bytes32 _merkleRoot,
        bytes32[] calldata _leaves
    ) internal view returns (bool) {
        address[] memory submitters = submittingOracles[_txHash];
        for (uint i = 0; i < submitters.length; i++) {
            OracleSubmissionData memory data = oracleSubmissionsData[_txHash][submitters[i]];
            if (data.merkleRoot != _merkleRoot || keccak256(abi.encode(data.leaves)) != keccak256(abi.encode(_leaves))) {
                return false;
            }
        }
        return true;
    }

    function handleCompromisedOracle(bytes32 _txHash) internal {
        emit OracleCompromised(_txHash);
    }

    function getMerkleRootByTxHash(bytes32 _txHash) external view returns (bytes32) {
        return txHashToMerkleRoot[_txHash];
    }

    function _verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) private pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }

    function verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 txHash,
        bytes32 leaf
    ) public view returns (bool) {

        require(txHashToMerkleRoot[txHash] != bytes32(0), "Transaction does not exist");

        bytes32 root = txHashToMerkleRoot[txHash];

        return _verifyMerkleProof(proof, root, leaf);
    }
}

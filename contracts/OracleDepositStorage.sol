// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract OracleDepositStorage is Ownable {
    /**
     * @notice Structure to hold oracle submission data including Merkle root and leaves.
     */
    struct OracleSubmissionData {
        bytes32 merkleRoot;
        bytes32[] leaves;
    }

    // Mapping from transaction hash to oracle address to OracleSubmissionData
    mapping(bytes32 => mapping(address => OracleSubmissionData)) public oracleSubmissionsData;
    // Mapping from transaction hash to number of deposit submissions
    mapping(bytes32 => uint) public depositSubmissions;
    // Mapping from transaction hash to array of submitting oracles
    mapping(bytes32 => address[]) public submittingOracles;
    // Mapping from transaction hash to Merkle root
    mapping(bytes32 => bytes32) public txHashToMerkleRoot;
    // Mapping from transaction hash to array of leaves
    mapping(bytes32 => bytes32[]) public txHashToLeaves;
    // Mapping from oracle address to boolean indicating if it is trusted
    mapping(address => bool) public trustedOracles;

    /**
     * @notice Modifier to allow only trusted oracles to call a function.
     */
    modifier onlyTrustedOracle() {
        require(trustedOracles[msg.sender], "Not a trusted oracle");
        _;
    }

    // Number of trusted oracles
    uint public oraclesAmount;

    /**
     * @notice Event emitted when an oracle is found to be compromised.
     * @param txHash The transaction hash.
     */
    event OracleCompromised(bytes32 indexed txHash);

    /**
     * @notice Event emitted when a deposit header is successfully submitted.
     * @param txHash The transaction hash.
     */
    event DepositHeaderSubmitted(bytes32 indexed txHash);

    /**
     * @notice Initializes the contract and sets the owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Adds a trusted oracle.
     * @dev Only the owner can add a trusted oracle.
     * @param _oracle The address of the oracle to add.
     */
    function addTrustedOracle(address _oracle) external onlyOwner {
        oraclesAmount++;
        trustedOracles[_oracle] = true;
    }

    /**
     * @notice Removes a trusted oracle.
     * @dev Only the owner can remove a trusted oracle.
     * @param _oracle The address of the oracle to remove.
     */
    function removeTrustedOracle(address _oracle) external onlyOwner {
        oraclesAmount--;
        trustedOracles[_oracle] = false;
    }

    /**
     * @notice Submits a deposit header.
     * @dev Requires the sender to be a trusted oracle. Ensures oracles submit the same data.
     *      Emits a DepositHeaderSubmitted event if the submission is successful, or an OracleCompromised event if the data does not match.
     * @param _txHash The transaction hash.
     * @param _merkleRoot The Merkle root.
     * @param _leaves The array of leaves.
     */
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
                emit DepositHeaderSubmitted(_txHash);
            } else {
                handleCompromisedOracle(_txHash);
            }
        }
    }

    /**
     * @notice Checks if all oracles submitted the same data.
     * @param _txHash The transaction hash.
     * @param _merkleRoot The Merkle root.
     * @param _leaves The array of leaves.
     * @return True if all oracles submitted the same data, false otherwise.
     */
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

    /**
     * @notice Handles the case when oracles are found to be compromised.
     * @param _txHash The transaction hash.
     */
    function handleCompromisedOracle(bytes32 _txHash) internal {
        emit OracleCompromised(_txHash);
    }

    /**
     * @notice Gets the Merkle root by transaction hash.
     * @param _txHash The transaction hash.
     * @return The Merkle root.
     */
    function getMerkleRootByTxHash(bytes32 _txHash) external view returns (bytes32) {
        return txHashToMerkleRoot[_txHash];
    }

    /**
     * @notice Verifies a Merkle proof.
     * @dev Private function to verify a Merkle proof.
     * @param proof The Merkle proof array.
     * @param root The Merkle root.
     * @param leaf The leaf node.
     * @return True if the proof is valid, false otherwise.
     */
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

    /**
     * @notice Public function to verify a Merkle proof.
     * @param proof The Merkle proof array.
     * @param txHash The transaction hash.
     * @param leaf The leaf node.
     * @return True if the proof is valid, false otherwise.
     */
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

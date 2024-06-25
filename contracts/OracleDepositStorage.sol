// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract OracleDepositStorage is Ownable {
    // Structure to store deposit header information

    struct DepositHeader {
        address recipient;
        address token;
        uint amount;
    }

    struct OracleSubmissionData {
        address recipient;
        address token;
        uint amount;
    }

    // Mapping to store deposit headers by block number
    mapping(bytes32 => DepositHeader) public depositHeaders;
    mapping(bytes32 => mapping(address => OracleSubmissionData)) public oracleSubmissionsData;
    mapping(bytes32 => uint) depositSubmissions;
    mapping(bytes32 => address[]) public submittingOracles;

    // Mapping to store trusted oracles
    mapping(address => bool) public trustedOracles;

    // Modifier to restrict access to only trusted oracles
    modifier onlyTrustedOracle() {
        require(trustedOracles[msg.sender], "Not a trusted oracle");
        _;
    }

    uint public oraclesAmount;

    event OracleCompromised(bytes32 indexed txHash);
    event DepositHeaderSubmitted(bytes32 indexed txHash, address recipient, address token, uint amount);

    constructor() Ownable(msg.sender) {}

    // Function to add a trusted oracle
    function addTrustedOracle(address _oracle) external onlyOwner {
        oraclesAmount++;
        trustedOracles[_oracle] = true;
    }

    // Function to remove a trusted oracle
    function removeTrustedOracle(address _oracle) external onlyOwner {
        oraclesAmount--;
        trustedOracles[_oracle] = false;
    }

    // Function to submit block header data
    function submitDepositHeader(
        bytes32 _txHash,
        address _recipient,
        address _token,
        uint _amount
    ) external onlyTrustedOracle {

        require(oracleSubmissionsData[_txHash][msg.sender].recipient == address(0), "Oracle has already submitted this deposit header");

        oracleSubmissionsData[_txHash][msg.sender] = OracleSubmissionData({
            recipient: _recipient,
            token: _token,
            amount: _amount
        });

        depositSubmissions[_txHash]++;
        submittingOracles[_txHash].push(msg.sender);

        // Calculate the threshold for 77% of oracles
        uint threshold = (oraclesAmount * 77) / 100;

        if (depositSubmissions[_txHash] >= threshold) {
            if (allOraclesSubmittedSameData(_txHash, _recipient, _token, _amount)) {
                depositHeaders[_txHash] = DepositHeader({
                    recipient: _recipient,
                    token: _token,
                    amount: _amount
                });
                emit DepositHeaderSubmitted(_txHash, _recipient, _token, _amount);
            } else {
                handleCompromisedOracle(_txHash);
            }
        }
    }

    function allOraclesSubmittedSameData(
        bytes32 _txHash,
        address _recipient,
        address _token,
        uint _amount
    ) internal view returns (bool) {
        address[] memory submitters = submittingOracles[_txHash];
        for (uint i = 0; i < submitters.length; i++) {
            OracleSubmissionData memory data = oracleSubmissionsData[_txHash][submitters[i]];
            if (data.recipient != _recipient || data.token != _token || data.amount != _amount) {
                return false;
            }
        }
        return true;
    }

    function handleCompromisedOracle(bytes32 _txHash) internal {
        
        emit OracleCompromised(_txHash);
    }

    // Function to retrieve block header data by block number
    function getBlockHeader(bytes32 _txHash) external view returns (DepositHeader memory) {
        return depositHeaders[_txHash];
    }
}

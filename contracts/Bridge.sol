// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IHandler} from "./interfaces/IHandler.sol";
import { OracleDepositStorage } from "./OracleDepositStorage.sol";
import "hardhat/console.sol";

contract Bridge is Ownable {

    uint public validatorstNonce;
    address public erc20Handler;
    mapping(address => bool) validators;
    mapping(bytes32 => bool) processedTransactions;

    OracleDepositStorage oracleDepositStorage;

    modifier onlyValidator() {
        _onlyValidator();
        _;
    }

    function _onlyValidator() private view {
        require(validators[msg.sender], "sender must be a validator");
    }

    constructor(address _oracleDepositStorage) Ownable(msg.sender) {
        oracleDepositStorage = OracleDepositStorage(_oracleDepositStorage);
    }
    
    event Deposit(
        address tokenAddress,
        address depositor,
        uint amount
    );

    function depositTokens(
        address tokenAddress,
        address depositor,
        uint256 amount
    ) external payable {
        require(msg.value > 0, "value of validator reward is too low");

        IHandler depositHandler = IHandler(erc20Handler);
        depositHandler.deposit(tokenAddress, msg.sender, amount);

        emit Deposit(tokenAddress, depositor, amount);
    }

   function receiveTokens(
        bytes32 _txHash,
        address _recipient,
        address _tokenAddress,
        uint256 _amount,
        bytes32 _leaf,
        bytes32[] calldata _proof
    ) external {
        require(!processedTransactions[_txHash], "Transaction is processed");
        require(oracleDepositStorage.verifyMerkleProof(_proof, _txHash, _leaf), "Invalid proof");

        // Generate the leaf from the passed parameters
        bytes32 generatedLeaf = keccak256(abi.encode(_tokenAddress, _recipient, _amount));
        // Verify the generated leaf matches the passed leaf
        require(generatedLeaf == _leaf, "Leaf does not match");

        

        processedTransactions[_txHash] = true;

        // Process the token transfer (e.g., mint tokens on the destination chain)
    }

    function setHandler(address _handler) external onlyOwner {
        erc20Handler = _handler;
    }

    function setValidator(address _validator) external onlyOwner {
        validatorstNonce++;
        validators[_validator] = true;
    }

    function setToken(address _token, bool _isBurnable, bool _isWhitelisted) external onlyOwner {
        IHandler depositHandler = IHandler(erc20Handler);
        depositHandler.setResource(_token, _isBurnable, _isWhitelisted);
    }

    receive() external payable {}
}
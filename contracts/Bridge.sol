// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IHandler} from "./interfaces/IHandler.sol";
import { OracleDepositStorage } from "./OracleDepositStorage.sol";
import "hardhat/console.sol";

contract Bridge is Ownable {

    uint public validatorsAmount;
    address public erc20Handler;
    mapping(address => bool) validators;
    mapping(bytes32 => bool) processedTransactions;

    OracleDepositStorage oracleDepositStorage;
    mapping(bytes32 => uint) public receiveSubmissions;
    mapping(address => address) public tokenToReceive;

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

    event Received(
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
        address _token,
        uint256 _amount,
        bytes32 _leaf,
        bytes32[] calldata _proof
    ) external onlyValidator {

        require(!processedTransactions[_txHash], "Transaction is processed");
        require(oracleDepositStorage.verifyMerkleProof(_proof, _txHash, _leaf), "Invalid proof");

        // Generate the leaf from the passed parameters
        bytes32 generatedLeaf = keccak256(abi.encode(_token, _recipient, _amount));
        // Verify the generated leaf matches the passed leaf
        require(generatedLeaf == _leaf, "Leaf does not match");

        address _tokenToReceive = tokenToReceive[_token];

        require((_tokenToReceive != address(0)), "Unknown Token");

        receiveSubmissions[_txHash]++;
        uint threshold = (validatorsAmount * 77) / 100;

        if (receiveSubmissions[_txHash] >= threshold) { 
            processedTransactions[_txHash] = true;
            processReceiveTokens(_tokenToReceive, _recipient, _amount);
        }
    }

    function processReceiveTokens(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal {
        
        IHandler depositHandler = IHandler(erc20Handler);
        (address returnedTokenAddress, address returnedRecipient, uint256 returnedAmount) = depositHandler.withdraw(_amount, _token, _recipient);

        emit Received(returnedTokenAddress, returnedRecipient, returnedAmount);
    }

    function setHandler(address _handler) external onlyOwner {
        erc20Handler = _handler;
    }

    function setValidator(address _validator) external onlyOwner {
        validatorsAmount++;
        validators[_validator] = true;
    }

    function setToken(address _token, bool _isBurnable, bool _isWhitelisted, address _pair) external onlyOwner {
        IHandler depositHandler = IHandler(erc20Handler);

        // TODO: move it to the Handler
        tokenToReceive[_pair] = _token;
        
        depositHandler.setResource(_token, _isBurnable, _isWhitelisted);
    }

    receive() external payable {}
}

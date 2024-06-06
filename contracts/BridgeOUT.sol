// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IHandler} from "./interfaces/IHandler.sol";
import "hardhat/console.sol"; // Import Hardhat console library

contract BridgeOUT is Ownable {

    struct Proposal {
        bool executed;
        uint validationsNonce;
        address token;
        uint amount; 
        uint  depositNonce; 
        address user;
    }

    uint public withdrawNonce;
    uint public validatorstNonce;
    address public erc20Handler;
    mapping(address => bool) validators;
    mapping(uint => Proposal) proposals;
    mapping(address => address) erc20PrivatePair;

    modifier onlyValidator() {
        _onlyValidator();
        _;
    }

    function _onlyValidator() private view {
        require(validators[msg.sender], "sender must be a validator");
    }

    constructor() Ownable(msg.sender){
    }
    
    event Withdraw(
        address tokenAddress,
        address recipientAddress,
        uint amount,
        uint nonce
    );

    event Deposit(
        address tokenAddress,
        address recipient,
        uint amount
    );

    function withdraw(
        address tokenAddress,
        address recipientAddress,
        uint256 amount
    ) external {

        withdrawNonce++;

        IHandler withdrawHandler = IHandler(erc20Handler);
        (address returnedTokenAddress, address returnedRecipient, uint256 returnedAmount) = withdrawHandler.withdraw(amount, tokenAddress, recipientAddress);

        emit Withdraw(returnedTokenAddress, returnedRecipient, returnedAmount, withdrawNonce);
    }

    function deposit(address token, uint amount, uint  depositNonce, address user) external onlyValidator() {

        require(!proposals[depositNonce].executed, "Proposal is executed");

        if (proposals[depositNonce].validationsNonce == 0){
            proposals[depositNonce].token = token;
            proposals[depositNonce].amount = amount;
            proposals[depositNonce].depositNonce = depositNonce;
            proposals[depositNonce].user = user;
        }
        proposals[depositNonce].validationsNonce++;

        if (proposals[depositNonce].validationsNonce >= validatorstNonce ){

            proposals[depositNonce].executed = true;
            address privateTokenfromToken = erc20PrivatePair[token];

            IHandler depositHandler = IHandler(erc20Handler);
            (address returnedTokenAddress, address returnedDepositor, uint256 returnedAmount) = depositHandler.deposit(privateTokenfromToken, user, amount);

            emit Deposit(returnedTokenAddress, returnedDepositor, returnedAmount);
        }
    }

    function setHandler(address _handler) external onlyOwner {
        erc20Handler = _handler;
    }

    function setValidator(address _validator) external onlyOwner {
        validatorstNonce++;
        validators[_validator] = true;
    }

    function setToken(address _token, bool _isBurnable, bool _isWhitelisted, address _erc20Pair) external onlyOwner {
        IHandler depositHandler = IHandler(erc20Handler);
        erc20PrivatePair[_erc20Pair] = _token;
        depositHandler.setResource(_token, _isBurnable, _isWhitelisted);
    }
}
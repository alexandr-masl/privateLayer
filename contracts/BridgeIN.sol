// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {IHandler} from "./interfaces/IHandler.sol";
import "hardhat/console.sol"; // Import Hardhat console library


contract BridgeIN {

    struct Proposal {
        bool executed;
        uint validationsNonce;
        address token;
        uint amount; 
        uint64  withdrawNonce; 
        address user;
    }

    address owner;
    uint public depositNonce;
    uint public validatorstNonce;
    address public erc20Handler;
    mapping(address => bool) validators;
    mapping(uint => Proposal) proposals;

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    modifier onlyValidator() {
        _onlyValidator();
        _;
    }

    function _onlyOwner() private view {
        require(msg.sender == owner, "sender must be owner");
    }

    function _onlyValidator() private view {
        require(validators[msg.sender], "sender must be a validator");
    }

    constructor(){
        owner = msg.sender;
    }
    
    event Deposit(
        address tokenAddress,
        address depositor,
        uint amount,
        uint nonce
    );

    event Withdraw(
        address tokenAddress,
        address recipient,
        uint amount
    );

    function deposit(
        address tokenAddress,
        address depositor,
        uint256 amount
    ) external {

        depositNonce++;

        IHandler depositHandler = IHandler(erc20Handler);
        (address returnedTokenAddress, address returnedDepositor, uint256 returnedAmount) = depositHandler.deposit(tokenAddress, depositor, amount);

        emit Deposit(returnedTokenAddress, returnedDepositor, returnedAmount, depositNonce);
    }

    function withdraw(address token, uint amount, uint64  withdrawNonce, address user) external onlyValidator() {

        require(!proposals[withdrawNonce].executed, "Proposal is executed");

        if (proposals[withdrawNonce].validationsNonce == 0){
            proposals[withdrawNonce].token = token;
            proposals[withdrawNonce].amount = amount;
            proposals[withdrawNonce].withdrawNonce = withdrawNonce;
            proposals[withdrawNonce].user = user;
        }
        proposals[withdrawNonce].validationsNonce++;

        console.log("================ Current validationsNonce:", proposals[withdrawNonce].validationsNonce);

        if (proposals[withdrawNonce].validationsNonce == validatorstNonce ){

            proposals[withdrawNonce].executed = true;

            IHandler withdrawHandler = IHandler(erc20Handler);
            (address returnedTokenAddress, address returnedRecipient, uint256 returnedAmount) = withdrawHandler.executeProposal(amount, token, user);

            emit Withdraw(returnedTokenAddress, returnedRecipient, returnedAmount);
        }
    }

    function setHandler(address _handler) external onlyOwner {
        erc20Handler = _handler;
    }

    function setValidator(address _validator) external onlyOwner {
        validators[_validator] = true;
    }

    function setToken(address _token, bool _isBurnable, bool _isWhitelisted) external onlyOwner {
        IHandler depositHandler = IHandler(erc20Handler);
        depositHandler.setResource(_token, _isBurnable, _isWhitelisted);
    }


}
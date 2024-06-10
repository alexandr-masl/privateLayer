// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IHandler} from "./interfaces/IHandler.sol";
import "hardhat/console.sol";

contract BridgeIN is Ownable {

    struct Proposal {
        bool executed;
        uint validationsNonce;
        address token;
        uint amount; 
        uint  withdrawNonce; 
        address user;
    }

    address public mainValidator;
    uint public depositNonce;
    uint public validatorstNonce;
    address public erc20Handler;
    mapping(address => bool) validators;
    mapping(uint => Proposal) proposals;

    modifier onlyValidator() {
        _onlyValidator();
        _;
    }

    function _onlyValidator() private view {
        require(validators[msg.sender], "sender must be a validator");
    }

    constructor() Ownable(msg.sender) {}
    
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
    ) external payable {
        require(msg.value > 0, "value of validator reward is too low");

        depositNonce++;

        IHandler depositHandler = IHandler(erc20Handler);
        (address returnedTokenAddress, address returnedDepositor, uint256 returnedAmount) = depositHandler.deposit(tokenAddress, depositor, amount);

        emit Deposit(returnedTokenAddress, returnedDepositor, returnedAmount, depositNonce);
    }
    
    function withdraw(address token, uint amount, uint withdrawNonce, address user, uint validatorReward) external onlyValidator() {

        require(!proposals[withdrawNonce].executed, "Proposal is executed");

        if (proposals[withdrawNonce].validationsNonce == 0){
            proposals[withdrawNonce].token = token;
            proposals[withdrawNonce].amount = amount;
            proposals[withdrawNonce].withdrawNonce = withdrawNonce;
            proposals[withdrawNonce].user = user;
        }
        proposals[withdrawNonce].validationsNonce++;

        if (proposals[withdrawNonce].validationsNonce >= validatorstNonce ){

            proposals[withdrawNonce].executed = true;

            IHandler withdrawHandler = IHandler(erc20Handler);
            (address returnedTokenAddress, address returnedRecipient, uint256 returnedAmount) = withdrawHandler.withdraw(amount, token, user);

            (bool success, ) = msg.sender.call{value: validatorReward}("");
            require(success, "Rewards transfer failed");

            emit Withdraw(returnedTokenAddress, returnedRecipient, returnedAmount);
        }
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
}
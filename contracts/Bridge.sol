// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IHandler} from "./interfaces/IHandler.sol";
import "hardhat/console.sol";

contract Bridge is Ownable {

    uint public validatorstNonce;
    address public erc20Handler;
    mapping(address => bool) validators;
    mapping(bytes32 => bool) processedTransactions;

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

    function receiveTokens(bytes32 _txHash) external onlyValidator() { 
        require(!processedTransactions[_txHash], "Transaction is processed");
        
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
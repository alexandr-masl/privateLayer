// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
    @title Interface for handler that handles generic deposits and deposit executions.
    @author ChainSafe Systems.
 */
interface IHandler {
    function deposit(address tokenAddress, address depositor, uint256 amount) external returns (address, address, uint256);
    function executeProposal(uint256 amount, address tokenAddress, address recipientAddress) external returns (address, address, uint256);
    function setResource(address token, bool isBurnable, bool isWhitelisted) external;
}

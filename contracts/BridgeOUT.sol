// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;
import "hardhat/console.sol"; // Import Hardhat console library


contract BridgeOUT {
    uint bridgeOUTdepositNonce;
    
    event Withdraw(
        address token,
        uint amount,
        uint64  depositNonce,
        address user
    );

    function handleProposal(uint8 destinationDomainID, uint resourceID, uint64 depositNonce, address user) external returns(address _user) {

        console.log("================ Got new Proposal| User:", user);
        return user;
    }

    function withdraw() external {
        console.log("================ withdraw");
        emit Withdraw(address(this), 1, 1, msg.sender);
    }
}
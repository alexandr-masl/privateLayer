// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./interfaces/IHandler.sol";
import "./ERC20Safe.sol";


contract ERC20Handler is IHandler, ERC20Safe {

    struct ERCTokenProperties {
      bool isWhitelisted;
      bool isBurnable;
    }

    address private _bridgeAddress;
    mapping (address => ERCTokenProperties) public tokenProperties;

    modifier onlyBridge() {
        _onlyBridge();
        _;
    }

    function _onlyBridge() private view {
        require(msg.sender == _bridgeAddress, "sender must be bridge contract");
    }

    error ContractAddressNotWhitelisted(address contractAddress);

    constructor( address bridgeAddress ) {
        _bridgeAddress = bridgeAddress;
    }

    function deposit(
        address tokenAddress,
        address depositor,
        uint256 amount
    ) external onlyBridge returns (address, address, uint256) {

        if (!tokenProperties[tokenAddress].isWhitelisted) revert ContractAddressNotWhitelisted(tokenAddress);

        if (tokenProperties[tokenAddress].isBurnable) {
            burnERC20(tokenAddress, depositor, amount);
        } else {
            lockERC20(tokenAddress, depositor, address(this), amount);
        }

        return (tokenAddress, depositor, amount);
    }

    function executeProposal(
        uint256 amount, 
        address tokenAddress, 
        address recipientAddress
    ) external onlyBridge returns (address, address, uint256) {

        if (!tokenProperties[tokenAddress].isWhitelisted) revert ContractAddressNotWhitelisted(tokenAddress);

        if (tokenProperties[tokenAddress].isBurnable) {
            mintERC20(tokenAddress, address(recipientAddress), amount);
        } else {
            releaseERC20(tokenAddress, address(recipientAddress), amount);
        }
        return (tokenAddress, recipientAddress, amount);
    }

    function setResource(address token, bool isBurnable, bool isWhitelisted) external onlyBridge {
        _setResource(token, isBurnable, isWhitelisted);
    }

    function _setResource(address token, bool isBurnable, bool isWhitelisted) internal {
        tokenProperties[token].isWhitelisted = isWhitelisted;
        tokenProperties[token].isBurnable = isBurnable;
    }
}

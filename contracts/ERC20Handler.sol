// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./interfaces/IHandler.sol";
import "./ERC20Safe.sol";

contract ERC20Handler is IHandler, ERC20Safe {

    /**
     * @notice Structure to hold properties of an ERC20 token.
     * @dev This includes whether the token is whitelisted and whether it is burnable.
     */
    struct ERCTokenProperties {
        bool isWhitelisted;
        bool isBurnable;
    }

    // Address of the bridge contract
    address private _bridgeAddress;

    // Mapping from token addresses to their properties
    mapping (address => ERCTokenProperties) public tokenProperties;

    /**
     * @notice Modifier to allow only the bridge contract to call a function.
     */
    modifier onlyBridge() {
        _onlyBridge();
        _;
    }

    /**
     * @notice Private function to check if the sender is the bridge contract.
     */
    function _onlyBridge() private view {
        require(msg.sender == _bridgeAddress, "sender must be bridge contract");
    }

    // Error thrown when a contract address is not whitelisted
    error ContractAddressNotWhitelisted(address contractAddress);

    /**
     * @notice Initializes the contract with the address of the bridge contract.
     * @param bridgeAddress The address of the bridge contract.
     */
    constructor(address bridgeAddress) {
        _bridgeAddress = bridgeAddress;
    }

    /**
     * @notice Deposits tokens into the contract.
     * @dev Requires the token to be whitelisted. If the token is burnable, it is burned; otherwise, it is locked.
     * @param tokenAddress The address of the token to deposit.
     * @param depositor The address of the depositor.
     * @param amount The amount of tokens to deposit.
     * @return The token address, depositor address, and amount deposited.
     */
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

    /**
     * @notice Withdraws tokens from the contract.
     * @dev Requires the token to be whitelisted. If the token is burnable, it is minted; otherwise, it is released.
     * @param amount The amount of tokens to withdraw.
     * @param tokenAddress The address of the token to withdraw.
     * @param recipientAddress The address of the recipient.
     * @return The token address, recipient address, and amount withdrawn.
     */
    function withdraw(
        uint256 amount, 
        address tokenAddress, 
        address recipientAddress
    ) external onlyBridge returns (address, address, uint256) {

        if (!tokenProperties[tokenAddress].isWhitelisted) revert ContractAddressNotWhitelisted(tokenAddress);

        if (tokenProperties[tokenAddress].isBurnable) {
            mintERC20(tokenAddress, recipientAddress, amount);
        } else {
            releaseERC20(tokenAddress, address(recipientAddress), amount);
        }
        return (tokenAddress, recipientAddress, amount);
    }

    /**
     * @notice Sets the properties of a token.
     * @dev Only the bridge contract can call this function.
     * @param token The address of the token.
     * @param isBurnable Boolean indicating if the token is burnable.
     * @param isWhitelisted Boolean indicating if the token is whitelisted.
     */
    function setResource(address token, bool isBurnable, bool isWhitelisted) external onlyBridge {
        _setResource(token, isBurnable, isWhitelisted);
    }

    /**
     * @notice Internal function to set the properties of a token.
     * @param token The address of the token.
     * @param isBurnable Boolean indicating if the token is burnable.
     * @param isWhitelisted Boolean indicating if the token is whitelisted.
     */
    function _setResource(address token, bool isBurnable, bool isWhitelisted) internal {
        tokenProperties[token].isWhitelisted = isWhitelisted;
        tokenProperties[token].isBurnable = isBurnable;
    }
}
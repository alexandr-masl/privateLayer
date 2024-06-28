// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    // Address of the handler contract
    address private handler;

    /**
     * @notice Initializes the contract with a name and symbol for the token.
     * @dev Calls the ERC20 constructor and sets the owner.
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}

    /**
     * @notice Modifier to allow only the handler to call a function.
     */
    modifier onlyHandler() {
        require(msg.sender == handler, "Caller is not the handler");
        _;
    }

    /**
     * @notice Sets the handler contract address.
     * @dev Only the owner can set the handler address.
     * @param _handler The address of the handler contract.
     */
    function setHandler(address _handler) external onlyOwner {
        handler = _handler;
    }

    /**
     * @notice Burns a specific amount of tokens from the caller's account.
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Burns a specific amount of tokens from a specified account.
     * @dev Requires the caller to have allowance for the specified account's tokens of at least the amount to burn.
     * @param account The account from which tokens will be burned.
     * @param amount The amount of tokens to burn.
     */
    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
    }

    /**
     * @notice Mints a specific amount of tokens to a specified account.
     * @dev Only the handler can mint tokens.
     * @param to The account to which tokens will be minted.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyHandler {
        _mint(to, amount);
    }
}

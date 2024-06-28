// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import { IHandler } from "./interfaces/IHandler.sol";
import { OracleDepositStorage } from "./OracleDepositStorage.sol";
import "hardhat/console.sol";

contract Bridge is Ownable {

    // Number of validators
    uint public validatorsAmount;

    // Address of the ERC20 handler contract
    address public erc20Handler;

    // Mapping of validator addresses to boolean
    mapping(address => bool) validators;

    // Mapping of processed transaction hashes to boolean
    mapping(bytes32 => bool) processedTransactions;

    // Instance of OracleDepositStorage contract
    OracleDepositStorage oracleDepositStorage;

    // Mapping of transaction hashes to number of receive submissions
    mapping(bytes32 => uint) public receiveSubmissions;

    // Mapping of token addresses to their corresponding receive addresses
    mapping(address => address) public tokenToReceive;

    /**
     * @notice Modifier to allow only validators to call a function.
     */
    modifier onlyValidator() {
        _onlyValidator();
        _;
    }

    /**
     * @notice Private function to check if the sender is a validator.
     */
    function _onlyValidator() private view {
        require(validators[msg.sender], "sender must be a validator");
    }

    /**
     * @notice Initializes the contract with the address of the OracleDepositStorage.
     * @dev The constructor sets the OracleDepositStorage contract address.
     * @param _oracleDepositStorage The address of the OracleDepositStorage contract.
     */
    constructor(address _oracleDepositStorage) Ownable(msg.sender) {
        // TODO: move it to the IInterface logic
        // TODO: add method to set the oracleDepositStorage
        oracleDepositStorage = OracleDepositStorage(_oracleDepositStorage);
    }
    
    /**
     * @notice Event emitted when tokens are deposited.
     * @param tokenAddress The address of the token.
     * @param depositor The address of the depositor.
     * @param amount The amount of tokens deposited.
     */
    event Deposit(
        address tokenAddress,
        address depositor,
        uint amount
    );

    /**
     * @notice Event emitted when tokens are received.
     * @param tokenAddress The address of the token.
     * @param depositor The address of the depositor.
     * @param amount The amount of tokens received.
     */
    event Received(
        address tokenAddress,
        address depositor,
        uint amount
    );

    /**
     * @notice Deposits tokens to the contract.
     * @dev Requires a non-zero validator reward. Uses the handler to deposit tokens.
     * @param tokenAddress The address of the token to deposit.
     * @param depositor The address of the depositor.
     * @param amount The amount of tokens to deposit.
     */
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

    /**
     * @notice Receives tokens from another chain.
     * @dev Requires the sender to be a validator and the transaction to be unprocessed.
     *      Verifies the Merkle proof and checks if the threshold of validators is reached.
     * @param _txHash The transaction hash from the source chain.
     * @param _recipient The address of the recipient.
     * @param _token The address of the token.
     * @param _amount The amount of tokens to receive.
     * @param _leaf The leaf node in the Merkle tree.
     * @param _proof The Merkle proof array.
     */
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

    /**
     * @notice Processes the received tokens.
     * @dev Calls the withdraw function on the handler to process the token reception.
     * @param _token The address of the token to process.
     * @param _recipient The address of the recipient.
     * @param _amount The amount of tokens to process.
     */
    function processReceiveTokens(
        address _token,
        address _recipient,
        uint256 _amount
    ) internal {
        
        IHandler depositHandler = IHandler(erc20Handler);
        (address returnedTokenAddress, address returnedRecipient, uint256 returnedAmount) = depositHandler.withdraw(_amount, _token, _recipient);

        emit Received(returnedTokenAddress, returnedRecipient, returnedAmount);
    }

    /**
     * @notice Sets the handler contract address.
     * @dev Only the owner can set the handler address.
     * @param _handler The address of the handler contract.
     */
    function setHandler(address _handler) external onlyOwner {
        erc20Handler = _handler;
    }

    /**
     * @notice Adds a validator.
     * @dev Only the owner can add a validator.
     * @param _validator The address of the validator.
     */
    function setValidator(address _validator) external onlyOwner {
        validatorsAmount++;
        validators[_validator] = true;
    }

    /**
     * @notice Sets the token properties and pairs.
     * @dev Only the owner can set the token properties. Also calls setResource on the handler.
     * @param _token The address of the token.
     * @param _isBurnable Boolean indicating if the token is burnable.
     * @param _isWhitelisted Boolean indicating if the token is whitelisted.
     * @param _pair The paired token address.
     */
    function setToken(address _token, bool _isBurnable, bool _isWhitelisted, address _pair) external onlyOwner {
        IHandler depositHandler = IHandler(erc20Handler);

        // TODO: move it to the Handler
        tokenToReceive[_pair] = _token;
        
        depositHandler.setResource(_token, _isBurnable, _isWhitelisted);
    }

    /**
     * @notice Fallback function to receive Ether.
     * @dev Allows the contract to receive Ether.
     */
    receive() external payable {}
}

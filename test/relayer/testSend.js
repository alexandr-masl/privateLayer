// scripts/deposit.js

require('dotenv').config();
const { ethers } = require("ethers");
const fs = require('fs');
const colors = require('colors');
const { BridgeOUT_address, Private_Token_Address, Bridged_Token_Address } = require('../../scripts/deploySettings.json');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeOUT.sol/BridgeOUT.json')).abi;

async function depositToPrivateChain(tokenAddress, depositAmount, nonce, recipient) {
    // Set up the provider for the private subnet
    const provider = new ethers.JsonRpcProvider('http://195.7.7.76:9650/ext/bc/k1Y3356wMav8d9pVMyY8NchuFhxBpYxjS7zjZrc4dMkvSqxwS/rpc');

    // Set up the deployer and validator wallets
    const validator = new ethers.Wallet(process.env.Validator_1, provider);

    console.log(`Performing with the account: ${validator.address}`);

    const prvtToken = new ethers.Contract(Private_Token_Address, [
        "function deposit() payable",
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ], validator);

    const bridgeContract = new ethers.Contract(
        BridgeOUT_address,
        bridgeAbi,
        validator
    );

    const DEPOSIT_TO = recipient;

    console.log(colors.white(`:::::::: RECIPIENT address: ${DEPOSIT_TO}`));

    console.log(colors.white(`Calling withdraw on the BridgeOUT contract`));

    const handler = await bridgeContract.erc20Handler();
    console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

    console.log(colors.white(`:::::::: Validator address: ${validator.address}`));

    const prvtTokenbalanceBeforeWithdraw = await prvtToken.balanceOf(DEPOSIT_TO);
    console.log(colors.white("::::::::::: Recipient prvtToken Balance before deposit:"), ethers.formatUnits(prvtTokenbalanceBeforeWithdraw, 18));

    const deposit = await bridgeContract.deposit(tokenAddress, depositAmount, nonce, recipient, {
        gasPrice: ethers.parseUnits('775', 'gwei')
    });

    const depositTxResult = await deposit.wait();
    console.log(colors.white("---- depositTxResult Tx Result"));
    console.log(depositTxResult);

    const prvtTokenbalanceAfterWithdraw = await prvtToken.balanceOf(DEPOSIT_TO);
    console.log(colors.white("::::::::::: Recipient prvtToken Balance after deposit:"), ethers.formatUnits(prvtTokenbalanceAfterWithdraw, 18));
}

module.exports = {
    depositToPrivateChain
};
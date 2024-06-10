require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const fs = require('fs');
const colors = require('colors');
const { BridgeOUT_address, Private_Token_Address, Bridged_Token_Address } = require('../deploySettings.json');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeOUT.sol/BridgeOUT.json')).abi;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Performing with the account: ${deployer.address}`);

    const prvtToken = await ethers.getContractAt([
        "function deposit() payable",
        "function balanceOf(address) view returns (uint256)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ], Private_Token_Address);

    const provider = deployer.provider;
    const validator = new ethers.Wallet(process.env.Validator_1, provider);

    const bridgeContract = new ethers.Contract(
        BridgeOUT_address, 
        bridgeAbi, 
        validator
    );

    console.log(colors.white(`Calling withdraw on the BridgeOUT contract`));

    const handler = await bridgeContract.erc20Handler();
    console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

    console.log(colors.white(`:::::::: Validator address: ${validator.address}`));

    const depositAmount = ethers.parseUnits('0.5', 18);

    const prvtTokenbalanceBeforeWithdraw = await prvtToken.connect(deployer).balanceOf(validator.address);
    console.log(colors.white("::::::::::: Validator prvtToken Balance before deposit:"), ethers.formatUnits(prvtTokenbalanceBeforeWithdraw, 18));

    const deposit = await bridgeContract.deposit(Bridged_Token_Address, depositAmount, 4, validator.address, {
        gasPrice: 775000000000
    });
        
    const depositTxResult = await deposit.wait();
    console.log(colors.white("---- depositTxResult Tx Result"));
    console.log(depositTxResult);

    const prvtTokenbalanceAfterWithdraw = await prvtToken.connect(deployer).balanceOf(validator.address);
    console.log(colors.white("::::::::::: Validator prvtToken Balance after deposit:"), ethers.formatUnits(prvtTokenbalanceAfterWithdraw, 18));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

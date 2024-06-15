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

    const localNet_Acc_1_Key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

    const provider = deployer.provider;
    const validator = new ethers.Wallet(localNet_Acc_1_Key, provider);

    const bridgeContract = new ethers.Contract(
        BridgeOUT_address, 
        bridgeAbi, 
        validator
    );

    console.log(colors.white(`Calling withdraw on the BridgeOUT contract`));

    const handler = await bridgeContract.erc20Handler();
    console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

    console.log(colors.white(`:::::::: Validator address: ${validator.address}`));

    const prvtTokenbalanceBeforeWithdraw = await prvtToken.connect(deployer).balanceOf(validator.address);
    console.log(colors.white("::::::::::: Validator prvtToken Balance before deposit:"), ethers.formatUnits(prvtTokenbalanceBeforeWithdraw, 18));


    const withdrawAmount = ethers.parseUnits('1', 18);

    //  should approve prvtToken for deposit to Bridge
    // const amountToWithdraw = ethers.parseUnits('3', 18);
    const handlerAddress = await bridgeContract.erc20Handler();
    console.log(colors.white("::::::::::: handlerAddress:"), handlerAddress)

    const approveTx = await prvtToken.connect(validator).approve(handlerAddress, withdrawAmount);
    await approveTx.wait();
    // Check the allowance
    const allowance = await prvtToken.allowance(validator.address, handlerAddress);
    console.log(colors.white("::::::::::: HANDLER prvtToken Allowance:"), allowance.toString());

    // const withdraw = await bridgeContract.withdraw(prvtToken.target, validator.address, withdrawAmount, {
    //     gasPrice: 775000000000
    // });
        
    // const withdrawTxResult = await withdraw.wait();
    // console.log(colors.white("---- withdrawTxResult Tx Result"));
    // console.log(withdrawTxResult);

    const prvtTokenbalanceAfterWithdraw = await prvtToken.connect(deployer).balanceOf(validator.address);
    console.log(colors.white("::::::::::: Validator prvtToken Balance after withdraw:"), ethers.formatUnits(prvtTokenbalanceAfterWithdraw, 18));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

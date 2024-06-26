require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const fs = require('fs');
const colors = require('colors');
const { BridgeOUT_address, Private_Token_Address } = require('../settings.json');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeOUT.sol/BridgeOUT.json')).abi;


describe("Bridge Contract Deployment and Interaction", function () {
    let deployer, prvtToken, bridgeContract;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Performing with the account: ${deployer.address}`);

        prvtToken = await ethers.getContractAt([
            "function deposit() payable",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], Private_Token_Address);

        bridgeContract = new ethers.Contract(
            BridgeOUT_address, 
            bridgeAbi, 
            deployer
        );
    });

    it("should approve prvtToken for deposit to Bridge", async function () {
        const amountToWithdraw = ethers.parseUnits('3', 18);
        const handlerAddress = await bridgeContract.erc20Handler();
        console.log(colors.white("::::::::::: handlerAddress:"), handlerAddress)

        const approveTx = await prvtToken.connect(deployer).approve(handlerAddress, amountToWithdraw);
        await approveTx.wait();
        // Check the allowance
        const allowance = await prvtToken.allowance(deployer.address, handlerAddress);
        console.log(colors.white("::::::::::: HANDLER prvtToken Allowance:"), allowance.toString());
    });


    it("should call withdraw of the BridgeOUT contract", async function () {

        const handler = await bridgeContract.erc20Handler();
        console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

        const withdrawAmount = ethers.parseUnits('0.5', 18);

        const prvtTokenbalanceAfterDeposit = await prvtToken.connect(deployer).balanceOf(deployer.address);
        console.log(colors.white("::::::::::: Deployer prvtToken Balance before deposit:"), prvtTokenbalanceAfterDeposit)

        const withdraw = await bridgeContract.withdraw(Private_Token_Address, deployer.address, withdrawAmount);
        const withdrawTxResult = await withdraw.wait();
        console.log(colors.white("---- depositTxResult Tx Result"));
        // console.log(depositTxResult);

        const prvtTokenbalance = await prvtToken.connect(deployer).balanceOf(deployer.address);
        console.log(colors.white("::::::::::: Deployer prvtToken Balance after deposit:"), prvtTokenbalance)
    });
});

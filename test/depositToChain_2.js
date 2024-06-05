require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const fs = require('fs');
const colors = require('colors');

// Read the ABI from the artifacts directory
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeIN.sol/BridgeIN.json')).abi;
const wETH_address = '0xFC00000000000000000000000000000000000006';

describe("Bridge Contract Deployment and Interaction", function () {
    let deployer, wETH, bridgeContract;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Performing with the account: ${deployer.address}`);

        wETH = await ethers.getContractAt([
            "function deposit() payable",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], wETH_address);

        bridgeContract = new ethers.Contract(
            "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf", 
            bridgeAbi, 
            deployer
        );
    });

    it("should deposit native token to the wETH contract", async function () {
        const depositAmount = ethers.parseEther("5"); // 1 ETH

        // Deposit ETH by calling the deposit function
        const tx = await wETH.connect(deployer).deposit({ value: depositAmount });
        const receipt = await tx.wait();

        const wETHbalance = await wETH.connect(deployer).balanceOf(deployer.address);
        console.log(colors.white("::::::::::: Deployer WETH Balance:"), wETHbalance)
    });

    it("should approve wETH for deposit to Bridge", async function () {
        const amountToDeposit = ethers.parseUnits('3', 18);
        const handlerAddress = await bridgeContract.erc20Handler();

        const approveTx = await wETH.connect(deployer).approve(handlerAddress, amountToDeposit);
        await approveTx.wait();
        // Check the allowance
        const allowance = await wETH.allowance(deployer.address, handlerAddress);
        console.log(colors.white("::::::::::: HANDLER wETH Allowance:"), allowance.toString());
    });


    it("should call deposit of the BridgeIN contract", async function () {

        const handler = await bridgeContract.erc20Handler();
        console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

        const depositAmount = ethers.parseUnits('1', 18);

        const deposit = await bridgeContract.deposit(wETH_address, deployer.address, depositAmount);
        const depositTxResult = await deposit.wait();
        // console.log(colors.white("---- depositTxResult Tx Result"));
        // console.log(depositTxResult);

        const wETHbalanceAfterDeposit = await wETH.connect(deployer).balanceOf(handler);
        console.log(colors.white("::::::::::: Handler WETH Balance after deposit:"), wETHbalanceAfterDeposit)

        const wETHbalance = await wETH.connect(deployer).balanceOf(deployer.address);
        console.log(colors.white("::::::::::: Deployer WETH Balance:"), wETHbalance)
    });
});

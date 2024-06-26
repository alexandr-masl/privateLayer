require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const fs = require('fs');
const colors = require('colors');
const { Bridge_address, WETH } = require('./bridgeConfig.json');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;


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
        ], WETH.network1);

        bridgeContract = new ethers.Contract(
            Bridge_address, 
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

        console.log(colors.white("::::::::::: handlerAddress:"), handlerAddress)

        const approveTx = await wETH.connect(deployer).approve(handlerAddress, amountToDeposit);
        await approveTx.wait();
        // Check the allowance
        const allowance = await wETH.allowance(deployer.address, handlerAddress);
        console.log(colors.white("::::::::::: HANDLER wETH Allowance:"), allowance.toString());
    });


    it("should call deposit of the Bridge contract", async function () {

        const handler = await bridgeContract.erc20Handler();
        console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

        const depositAmount = ethers.parseUnits('1', 18);
        const gasFee = ethers.parseUnits('0.01', 'ether'); // Example gas fee

        const deposit = await bridgeContract.depositTokens(WETH.network1, deployer.address, depositAmount, { value: gasFee });
        const depositTxResult = await deposit.wait();
        // console.log(colors.white("---- depositTxResult Tx Result"));
        // console.log(depositTxResult);

        const wETHbalanceAfterDeposit = await wETH.connect(deployer).balanceOf(handler);
        console.log(colors.white("::::::::::: Handler WETH Balance after deposit:"), wETHbalanceAfterDeposit)

        const wETHbalance = await wETH.connect(deployer).balanceOf(deployer.address);
        console.log(colors.white("::::::::::: Deployer WETH Balance:"), wETHbalance)
    });

    
});

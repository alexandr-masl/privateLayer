require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const fs = require('fs');
const colors = require('colors');
const { BridgeIN_address, Validator_1 } = require('./settings.json');
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

        // bridgeContract = new ethers.Contract(
        //     BridgeIN_address, 
        //     bridgeAbi, 
        //     deployer
        // );

        const provider = deployer.provider;
        const validator = new ethers.Wallet(Validator_1, provider);

        bridgeContract = new ethers.Contract(
            BridgeIN_address, 
            bridgeAbi, 
            validator
        );
    });

    it("should call withdraw of the BridgeIN contract", async function () {

        const handler = await bridgeContract.erc20Handler();
        console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

        const withdrawAmount = ethers.parseUnits('0.5', 18);

        const withdraw = await bridgeContract.withdraw( wETH_address, withdrawAmount,  1, deployer.address);
        const withdrawTxResult = await withdraw.wait();
        // console.log(colors.white("---- depositTxResult Tx Result"));
        // console.log(depositTxResult);

        const wETHbalanceAfterWithdraw = await wETH.connect(deployer).balanceOf(handler);
        console.log(colors.white("::::::::::: Handler WETH Balance after withdraw:"), wETHbalanceAfterWithdraw)

        const wETHbalance = await wETH.connect(deployer).balanceOf(deployer.address);
        console.log(colors.white("::::::::::: Deployer WETH Balance:"), wETHbalance)
    });
});

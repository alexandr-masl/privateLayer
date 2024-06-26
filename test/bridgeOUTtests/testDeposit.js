require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const fs = require('fs');
const colors = require('colors');
const { BridgeOUT_address, Private_Token_Address, Validator_1, Bridged_Token_Address } = require('../settings.json');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeOUT.sol/BridgeOUT.json')).abi;


describe("Bridge Contract Deployment and Interaction", function () {
    let deployer, prvtToken, bridgeContract, validator;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Performing with the account: ${deployer.address}`);

        prvtToken = await ethers.getContractAt([
            "function deposit() payable",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], Private_Token_Address);

        const provider = deployer.provider;
        validator = new ethers.Wallet(Validator_1, provider);

        bridgeContract = new ethers.Contract(
            BridgeOUT_address, 
            bridgeAbi, 
            validator
        );
    });

    it("should call withdraw of the BridgeIN contract", async function () {

        const handler = await bridgeContract.erc20Handler();
        console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

        const withdrawAmount = ethers.parseUnits('0.5', 18);

        const prvtTokenbalanceAfterWithdraw = await prvtToken.connect(deployer).balanceOf(validator.address);
        console.log(colors.white("::::::::::: Validator prvtToken Balance before deposit:"), prvtTokenbalanceAfterWithdraw)


        const withdraw = await bridgeContract.deposit( Bridged_Token_Address, withdrawAmount,  4, validator.address);
        const withdrawTxResult = await withdraw.wait();
        console.log(colors.white("---- depositTxResult Tx Result"));
        // console.log(depositTxResult);

        const prvtTokenbalance = await prvtToken.connect(deployer).balanceOf(validator.address);
        console.log(colors.white("::::::::::: Validator prvtToken Balance after deposit:"), prvtTokenbalance)
    });
});

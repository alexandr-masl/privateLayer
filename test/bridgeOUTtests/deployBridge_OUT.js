require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const { Validator_1, Bridged_Token_Address } = require('../settings.json');
const colors = require('colors');


describe("Bridge Contract Deployment and Interaction", function () {
    let deployer, bridge, token, ercHandler;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Deploying contracts with the account: ${deployer.address}`);
    });

    it("should deploy the Token contract", async function () {
        const initialSupply = ethers.parseUnits('10000', 18);
        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Private FRAX", "prvtFRAX", initialSupply);
        console.log(colors.white(`:::::::: Token contract deployed to: ${token.target}`));

        const deployerBalance = await token.balanceOf(deployer.address);
        console.log(colors.green(`:::::::: Deployer's token balance: ${ethers.formatUnits(deployerBalance, 18)} prvtFRAX`));
    });

    it("should deploy the BridgeOUT contract", async function () {
        const BridgeOUT = await ethers.getContractFactory("BridgeOUT");
        bridge = await BridgeOUT.deploy();
        console.log(colors.white(`:::::::: BridgeOUT contract deployed to: ${bridge.target}`));
    });

    it("should deploy the ERC20Handler contract", async function () {
        const ERC20Handler = await ethers.getContractFactory("ERC20Handler");
        ercHandler = await ERC20Handler.deploy(bridge.target);
        console.log(colors.white(`:::::::: ERC20Handler contract deployed to: ${ercHandler.target}`));
    });

    describe("Contracts setting", function () {

        it("should set Token's Handler", async function () {

            const setHandler = await token.connect(deployer).setHandler(ercHandler.target);
            const setHandlerTxReceipt = await setHandler.wait();
            console.log(colors.white(`:::::::: set TOKEN Handler Tx Receipt:`));
            // console.log(setValidatorTxReceipt);
        });

        it("should set ERC20Handler to the BridgeIN", async function () {

            const setHandler = await bridge.connect(deployer).setHandler(ercHandler.target);
            const setHandlerTxReceipt = await setHandler.wait();
            // console.log(colors.white(`:::::::: setHandlerTxReceipt:`));
            // console.log(setHandlerTxReceipt);
            const handler = await bridge.connect(deployer).erc20Handler();
            console.log(colors.white(`:::::::: Handler address at bridge: ${handler}`));
        });

        it("should set prvtFRAX in ERC20Handler", async function () {

            const setToken = await bridge.connect(deployer).setToken(token.target, true, true, Bridged_Token_Address);
            const setTokenTxReceipt = await setToken.wait();
            console.log(colors.white(`:::::::: setTokenTxReceipt:`));
            // console.log(setTokenTxReceipt);
        });

        it("should set Validator in Bridge", async function () {

            const validator= new ethers.Wallet(Validator_1);
            console.log(colors.white(`:::::::: Validator 1 address: ${validator.address}`));

            const setValidator = await bridge.connect(deployer).setValidator(validator.address);
            const setValidatorTxReceipt = await setValidator.wait();
            console.log(colors.white(`:::::::: setValidatorTxReceipt:`));
            // console.log(setValidatorTxReceipt);
        });
    })
});
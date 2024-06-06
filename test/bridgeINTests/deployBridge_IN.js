require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');
const { Validator_1 } = require('../settings.json');

describe("Bridge Contract Deployment and Interaction", function () {
    let deployer, bridge, ercHandler;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Deploying contracts with the account: ${deployer.address}`);
    });

    it("should deploy the BridgeIN contract", async function () {
        const BridgeIN = await ethers.getContractFactory("BridgeIN");
        bridge = await BridgeIN.deploy();
        console.log(colors.white(`:::::::: BridgeIN contract deployed to: ${bridge.target}`));
    });

    it("should deploy the ERC20Handler contract", async function () {
        const ERC20Handler = await ethers.getContractFactory("ERC20Handler");
        ercHandler = await ERC20Handler.deploy(bridge.target);
        console.log(colors.white(`:::::::: ERC20Handler contract deployed to: ${ercHandler.target}`));
    });

    it("should set ERC20Handler to the BridgeIN", async function () {

        const setHandler = await bridge.connect(deployer).setHandler(ercHandler.target);
        const setHandlerTxReceipt = await setHandler.wait();
        // console.log(colors.white(`:::::::: setHandlerTxReceipt:`));
        // console.log(setHandlerTxReceipt);

        const handler = await bridge.connect(deployer).erc20Handler();
        console.log(colors.white(`:::::::: Handler address at bridge: ${handler}`));
    });

    it("should set wETH in ERC20Handler", async function () {

        const wETH_address = '0xFC00000000000000000000000000000000000006';

        const setToken = await bridge.connect(deployer).setToken(wETH_address, false, true);
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

});
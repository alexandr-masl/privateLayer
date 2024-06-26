require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');
const { Validator1_Address, Oracle1_Address, WETH, FRAX } = require('./bridgeConfig.json');


describe("Bridge Contract Deployment and Interaction", function () {
    let deployer, bridge, ercHandler, oracleDepositStorage;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Deploying contracts with the account: ${deployer.address}`);
    });

    it("should deploy the OracleDepositStorage contract", async function () {
        const OracleDepositStorage = await ethers.getContractFactory("OracleDepositStorage");
        oracleDepositStorage = await OracleDepositStorage.deploy();
        console.log(colors.white(`:::::::: OracleDepositStorage contract deployed to: ${oracleDepositStorage.target}`));
    });

    it("should set Trusted Oracle in OracleDepositStorage", async function () {

        console.log(colors.white(`:::::::: Oracle 1 address: ${Oracle1_Address}`));

        const setOracle = await oracleDepositStorage.connect(deployer).addTrustedOracle(Oracle1_Address);
        const setOracleTxReceipt = await setOracle.wait();
        console.log(colors.white(`:::::::: setOracleTxReceipt:`));
        // console.log(setValidatorTxReceipt);
    });

    it("should deploy the Bridge contract", async function () {
        const Bridge = await ethers.getContractFactory("Bridge");
        bridge = await Bridge.deploy(oracleDepositStorage.target);
        console.log(colors.white(`:::::::: Bridge contract deployed to: ${bridge.target}`));
    });

    it("should deploy the ERC20Handler contract", async function () {
        const ERC20Handler = await ethers.getContractFactory("ERC20Handler");
        ercHandler = await ERC20Handler.deploy(bridge.target);
        console.log(colors.white(`:::::::: ERC20Handler contract deployed to: ${ercHandler.target}`));
    });

    it("should set ERC20Handler to the Bridge", async function () {

        const setHandler = await bridge.connect(deployer).setHandler(ercHandler.target);
        const setHandlerTxReceipt = await setHandler.wait();
        // console.log(colors.white(`:::::::: setHandlerTxReceipt:`));
        // console.log(setHandlerTxReceipt);

        const handler = await bridge.connect(deployer).erc20Handler();
        console.log(colors.white(`:::::::: Handler address at bridge: ${handler}`));
    });

    it("should set wETH in ERC20Handler", async function () {

        const setToken = await bridge.connect(deployer).setToken(WETH.network1, false, true, WETH.network2);
        const setTokenTxReceipt = await setToken.wait();
        console.log(colors.white(`:::::::: setTokenTxReceipt:`));
        // console.log(setTokenTxReceipt);
    });

    it("should set FRAX in ERC20Handler", async function () {

        const setToken = await bridge.connect(deployer).setToken(FRAX.network1, false, true, FRAX.network2);
        const setTokenTxReceipt = await setToken.wait();
        console.log(colors.white(`:::::::: setTokenTxReceipt:`));
        // console.log(setTokenTxReceipt);
    });

    it("should set Validator in Bridge", async function () {

        console.log(colors.white(`:::::::: Validator 1 address: ${Validator1_Address}`));

        const setValidator = await bridge.connect(deployer).setValidator(Validator1_Address);
        const setValidatorTxReceipt = await setValidator.wait();
        console.log(colors.white(`:::::::: setValidatorTxReceipt:`));
        // console.log(setValidatorTxReceipt);
    });

});
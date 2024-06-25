require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');

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

        const validatorAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

        console.log(colors.white(`:::::::: Oracle 1 address: ${validatorAddress}`));

        const setOracle = await oracleDepositStorage.connect(deployer).addTrustedOracle(validatorAddress);
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

        const wETH_address = '0xFC00000000000000000000000000000000000006';

        const setToken = await bridge.connect(deployer).setToken(wETH_address, false, true);
        const setTokenTxReceipt = await setToken.wait();
        console.log(colors.white(`:::::::: setTokenTxReceipt:`));
        // console.log(setTokenTxReceipt);
    });

    it("should set FRAX in ERC20Handler", async function () {

        const FRAX_address = '0xFc00000000000000000000000000000000000001';

        const setToken = await bridge.connect(deployer).setToken(FRAX_address, false, true);
        const setTokenTxReceipt = await setToken.wait();
        console.log(colors.white(`:::::::: setTokenTxReceipt:`));
        // console.log(setTokenTxReceipt);
    });

    it("should set Validator in Bridge", async function () {

        const validator= new ethers.Wallet(process.env.Validator_1);

        console.log(colors.white(`:::::::: Validator 1 address: ${validator.address}`));

        const setValidator = await bridge.connect(deployer).setValidator(validator.address);
        const setValidatorTxReceipt = await setValidator.wait();
        console.log(colors.white(`:::::::: setValidatorTxReceipt:`));
        // console.log(setValidatorTxReceipt);
    });

});
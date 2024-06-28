require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const fs = require('fs');
const { ethers } = require("hardhat");
const { Bridge, WETH, FRAX } = require('./bridgeConfig.json');
const colors = require('colors');

describe("Token Contract Deployment and Interaction", function () {
    let deployer, bridge;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Deploying contracts with the account: ${deployer.address}`);

        bridge = new ethers.Contract(Bridge.network2, JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi, deployer);
    });

    it("should set PRIVATE wETH in ERC20Handler", async function () {

        const setToken = await bridge.connect(deployer).setToken(WETH.network2, true, true, WETH.network1);
        const setTokenTxReceipt = await setToken.wait();
        console.log(colors.white(`:::::::: setTokenTxReceipt:`));
        // console.log(setTokenTxReceipt);
    });

    it("should set PRIVATE FRAX in ERC20Handler", async function () {

        const setToken = await bridge.connect(deployer).setToken(FRAX.network2, true, true, FRAX.network1);
        const setTokenTxReceipt = await setToken.wait();
        console.log(colors.white(`:::::::: setTokenTxReceipt:`));
        // console.log(setTokenTxReceipt);
    });
});
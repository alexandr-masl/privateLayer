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

        bridge = new ethers.Contract(Bridge.network1, JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi, deployer);
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
});
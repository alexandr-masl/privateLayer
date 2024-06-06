require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');


describe("Bridge Contract Deployment and Interaction", function () {
    let deployer, bridge;
    const domainID = 1;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Deploying contracts with the account: ${deployer.address}`);
    });

    it("should deploy the BridgeOUT contract", async function () {
        const BridgeOUT = await ethers.getContractFactory("BridgeOUT");
        bridge = await BridgeOUT.deploy();
        console.log(colors.white(`:::::::: BridgeOUT contract deployed to: ${bridge.target}`));
    });
});
require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');
const bridgeOutAbi = require('../abi/bridgeOutAbi.json');


describe("Bridge Contract Deployment and Interaction", function () {
    let deployer, bridge;
    const domainID = 1;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Performing with the account: ${deployer.address}`);
    });

    it("should call withdraw of the BridgeOUT contract", async function () {

        const bridgeOUTContract = new ethers.Contract(
            "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6", 
            bridgeOutAbi, 
            deployer
        );

        const withdraw = await bridgeOUTContract.withdraw();

        const withdrawTxResult = await withdraw.wait();
        console.log(colors.white("---- withdrawTxResult Tx Result"));
        console.log(withdrawTxResult.events);
    });
});
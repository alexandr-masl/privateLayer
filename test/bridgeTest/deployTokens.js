require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const { PrivateLayerERCHandlerAddress } = require('./bridgeConfig.json');
const colors = require('colors');


describe("Token Contract Deployment and Interaction", function () {
    let deployer, wethTOKEN, fraxTOKEN;

    before(async function () {
        [deployer] = await ethers.getSigners();
        console.log(`Deploying contracts with the account: ${deployer.address}`);
    });

    it("should deploy WETH Token contract", async function () {
        const WETH_Token = await ethers.getContractFactory("Token");
        wethTOKEN = await WETH_Token.deploy("Private WETH", "prvtWETH");
        console.log(colors.white(`:::::::: PRIVATE-WETH Token contract deployed to: ${wethTOKEN.target}`));
    });

    it("should deploy FRAX Token contract", async function () {
        const FRAX_Token = await ethers.getContractFactory("Token");
        fraxTOKEN = await FRAX_Token.deploy("Private FRAX", "prvtFRAX");
        console.log(colors.white(`:::::::: PRIVATE-FRAX Token contract deployed to: ${fraxTOKEN.target}`));
    });

    describe("Token's Handler setting", function () {

        it("should set WETH Token's Handler", async function () {
            const setHandler = await wethTOKEN.connect(deployer).setHandler(PrivateLayerERCHandlerAddress);
            const setHandlerTxReceipt = await setHandler.wait();
            console.log(colors.white(`:::::::: set WETH TOKEN Handler Tx Receipt:`));
            // console.log(setValidatorTxReceipt);
        }); 

        it("should set FRAX Token's Handler", async function () {
            const setHandler = await fraxTOKEN.connect(deployer).setHandler(PrivateLayerERCHandlerAddress);
            const setHandlerTxReceipt = await setHandler.wait();
            console.log(colors.white(`:::::::: set FRAX TOKEN Handler Tx Receipt:`));
            // console.log(setValidatorTxReceipt);
        }); 
    })
});
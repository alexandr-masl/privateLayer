require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const { PrivateLayerERCHandlerAddress } = require('./deployConfig.json');
const colors = require('colors');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    // Deploy WETH Token contract
    const WETH_Token = await ethers.getContractFactory("Token");
    const wethTOKEN = await WETH_Token.deploy("Private WETH", "prvtWETH");
    console.log(colors.white(`:::::::: PRIVATE-WETH Token contract deployed to: ${wethTOKEN.target}`));

    // Deploy FRAX Token contract
    const FRAX_Token = await ethers.getContractFactory("Token");
    const fraxTOKEN = await FRAX_Token.deploy("Private FRAX", "prvtFRAX");
    console.log(colors.white(`:::::::: PRIVATE-FRAX Token contract deployed to: ${fraxTOKEN.target}`));

    // Set WETH Token's Handler
    const setWETHHandlerTx = await wethTOKEN.connect(deployer).setHandler(PrivateLayerERCHandlerAddress);
    await setWETHHandlerTx.wait();
    console.log(colors.white(`:::::::: WETH TOKEN Handler has been set`));

    // Set FRAX Token's Handler
    const setFRAXHandlerTx = await fraxTOKEN.connect(deployer).setHandler(PrivateLayerERCHandlerAddress);
    await setFRAXHandlerTx.wait();
    console.log(colors.white(`:::::::: FRAX TOKEN Handler has been set`));
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});
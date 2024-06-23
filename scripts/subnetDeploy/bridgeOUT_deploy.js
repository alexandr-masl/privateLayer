require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const {Bridged_Token_Address, FRAX_Token_Address } = require('../deploySettings.json');
const colors = require('colors');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    // Deploy the Token contract
    const initialSupply = ethers.parseUnits('1000000000000000000000', 18);
    const Token = await ethers.getContractFactory("Token");
    const tokenWETH = await Token.deploy("Private WETH", "prvtWETH", initialSupply);
    const tokenFRAX = await Token.deploy("Private FRAX", "prvtFRAX", initialSupply);

    console.log(colors.white(`:::::::: WETH Token contract deployed to: ${tokenWETH.target}`));
    console.log(colors.white(`:::::::: FRAX Token contract deployed to: ${tokenFRAX.target}`));

    const deployerBalance = await tokenWETH.balanceOf(deployer.address);
    console.log(colors.green(`:::::::: Deployer's tokenWETH balance: ${ethers.formatUnits(deployerBalance, 18)} prvtWETH`));

    // const deployerFRAXBalance = await tokenFRAX.balanceOf(deployer.address);
    // console.log(colors.green(`:::::::: Deployer's FRAX balance: ${ethers.formatUnits(deployerFRAXBalance, 18)} prvtFRAX`));

    // Deploy the BridgeOUT contract
    const BridgeOUT = await ethers.getContractFactory("BridgeOUT");
    const bridge = await BridgeOUT.deploy();
    console.log(colors.white(`:::::::: BridgeOUT contract deployed to: ${bridge.target}`));

    // Deploy the ERC20Handler contract
    const ERC20Handler = await ethers.getContractFactory("ERC20Handler");
    const ercHandler = await ERC20Handler.deploy(bridge.target);
    console.log(colors.white(`:::::::: ERC20Handler contract deployed to: ${ercHandler.target}`));

    // Set WETH Token's Handler
    const setHandler = await tokenWETH.connect(deployer).setHandler(ercHandler.target);
    await setHandler.wait();
    console.log(colors.white(`:::::::: WETH Token Handler set`));

    const setFRAXHandler = await tokenFRAX.connect(deployer).setHandler(ercHandler.target);
    await setFRAXHandler.wait();
    console.log(colors.white(`:::::::: FRAX Token Handler set`));

    // Set ERC20Handler to the Bridge
    const setBridgeHandler = await bridge.connect(deployer).setHandler(ercHandler.target);
    await setBridgeHandler.wait();
    const handler = await bridge.connect(deployer).erc20Handler();
    console.log(colors.white(`:::::::: Handler address at bridge: ${handler}`));

    // Set prvtFRAX in ERC20Handler
    const setToken = await bridge.connect(deployer).setToken(tokenWETH.target, true, true, Bridged_Token_Address);
    await setToken.wait();
    console.log(colors.white(`:::::::: WETH Token set in ERC20Handler`));

     // Set prvtFRAX in ERC20Handler
     const setFRAXToken = await bridge.connect(deployer).setToken(tokenFRAX.target, true, true, FRAX_Token_Address);
     await setFRAXToken.wait();
     console.log(colors.white(`:::::::: FRAX Token set in ERC20Handler`));

    // Set Validator in Bridge
    const validator = new ethers.Wallet(process.env.Validator_1);
    console.log(colors.white(`:::::::: Validator 1 address: ${validator.address}`));

    const setValidator = await bridge.connect(deployer).setValidator(validator.address);
    await setValidator.wait();
    console.log(colors.white(`:::::::: Validator set in Bridge`));
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});

require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const {Bridged_Token_Address } = require('../deploySettings.json');
const colors = require('colors');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    // Deploy the Token contract
    const initialSupply = ethers.parseUnits('1000000000000000000000', 18);
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy("Private FRAX", "prvtFRAX", initialSupply);
    console.log(colors.white(`:::::::: Token contract deployed to: ${token.target}`));

    const deployerBalance = await token.balanceOf(deployer.address);
    console.log(colors.green(`:::::::: Deployer's token balance: ${ethers.formatUnits(deployerBalance, 18)} prvtFRAX`));

    // Deploy the BridgeOUT contract
    const BridgeOUT = await ethers.getContractFactory("BridgeOUT");
    const bridge = await BridgeOUT.deploy();
    console.log(colors.white(`:::::::: BridgeOUT contract deployed to: ${bridge.target}`));

    // Deploy the ERC20Handler contract
    const ERC20Handler = await ethers.getContractFactory("ERC20Handler");
    const ercHandler = await ERC20Handler.deploy(bridge.target);
    console.log(colors.white(`:::::::: ERC20Handler contract deployed to: ${ercHandler.target}`));

    // Set Token's Handler
    const setHandler = await token.connect(deployer).setHandler(ercHandler.target);
    await setHandler.wait();
    console.log(colors.white(`:::::::: Token Handler set`));

    // Set ERC20Handler to the Bridge
    const setBridgeHandler = await bridge.connect(deployer).setHandler(ercHandler.target);
    await setBridgeHandler.wait();
    const handler = await bridge.connect(deployer).erc20Handler();
    console.log(colors.white(`:::::::: Handler address at bridge: ${handler}`));

    // Set prvtFRAX in ERC20Handler
    const setToken = await bridge.connect(deployer).setToken(token.target, true, true, Bridged_Token_Address);
    await setToken.wait();
    console.log(colors.white(`:::::::: Token set in ERC20Handler`));

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

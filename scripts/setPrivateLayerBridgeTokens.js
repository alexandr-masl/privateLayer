require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const fs = require('fs');
const { ethers } = require("hardhat");
const { Bridge, WETH, FRAX } = require('./deployConfig.json');
const colors = require('colors');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;
    const bridge = new ethers.Contract(Bridge.network2, bridgeAbi, deployer);

    // Set PRIVATE wETH in ERC20Handler
    const setWETHToken = await bridge.connect(deployer).setToken(WETH.network2, true, true, WETH.network1);
    await setWETHToken.wait();
    console.log(colors.white(`:::::::: PRIVATE wETH token set in ERC20Handler`));

    // Set PRIVATE FRAX in ERC20Handler
    const setFRAXToken = await bridge.connect(deployer).setToken(FRAX.network2, true, true, FRAX.network1);
    await setFRAXToken.wait();
    console.log(colors.white(`:::::::: PRIVATE FRAX token set in ERC20Handler`));
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});

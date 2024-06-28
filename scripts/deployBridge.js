require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');

const Validator1_Address = process.env.Validator1_Address;
const Oracle1_Address = process.env.Oracle1_Address;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    // Deploy OracleDepositStorage contract
    const OracleDepositStorage = await ethers.getContractFactory("OracleDepositStorage");
    const oracleDepositStorage = await OracleDepositStorage.deploy();
    console.log(colors.white(`:::::::: OracleDepositStorage contract deployed to: ${oracleDepositStorage.target}`));

    // Set Trusted Oracle in OracleDepositStorage
    console.log(colors.white(`:::::::: Oracle 1 address: ${Oracle1_Address}`));
    const setOracleTx = await oracleDepositStorage.connect(deployer).addTrustedOracle(Oracle1_Address);
    await setOracleTx.wait();
    console.log(colors.white(`:::::::: Oracle has been set in OracleDepositStorage`));

    // Deploy Bridge contract
    const Bridge = await ethers.getContractFactory("Bridge");
    const bridge = await Bridge.deploy(oracleDepositStorage.target);
    console.log(colors.white(`:::::::: Bridge contract deployed to: ${bridge.target}`));

    // Deploy ERC20Handler contract
    const ERC20Handler = await ethers.getContractFactory("ERC20Handler");
    const ercHandler = await ERC20Handler.deploy(bridge.target);
    console.log(colors.white(`:::::::: ERC20Handler contract deployed to: ${ercHandler.target}`));

    // Set ERC20Handler to the Bridge
    const setHandlerTx = await bridge.connect(deployer).setHandler(ercHandler.target);
    await setHandlerTx.wait();
    const handler = await bridge.connect(deployer).erc20Handler();
    console.log(colors.white(`:::::::: Handler address at bridge: ${handler}`));

    // Set Validator in Bridge
    console.log(colors.white(`:::::::: Validator 1 address: ${Validator1_Address}`));
    const setValidatorTx = await bridge.connect(deployer).setValidator(Validator1_Address);
    await setValidatorTx.wait();
    console.log(colors.white(`:::::::: Validator has been set in the Bridge`));
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});

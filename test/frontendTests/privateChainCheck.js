require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const fs = require('fs');
const colors = require('colors');
const { expect } = require('chai');
const { BridgeOUT_address, Private_Token_Address, Bridged_Token_Address } = require('../../scripts/deploySettings.json');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeOUT.sol/BridgeOUT.json')).abi;

const privateSubnetUrl = 'http://195.7.7.76:9650/ext/bc/k1Y3356wMav8d9pVMyY8NchuFhxBpYxjS7zjZrc4dMkvSqxwS/rpc';

describe('BridgeOUT Contract Tests', function () {
    let deployer;
    let validator;
    let prvtToken;
    let bridgeContract;
    let provider;

    const ADDRESS_TO_CHECK = "0x9Da201f324C4ce22fAe97310CFd08Bd650B17996";

    before(async function () {
        // Set up the provider for the private subnet
        provider = new ethers.JsonRpcProvider(privateSubnetUrl);
        
        // Set up the validator wallet using the private subnet provider
        validator = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        [deployer] = await ethers.getSigners();
        console.log(`Performing with the account: ${deployer.address}`);
        
        prvtToken = await ethers.getContractAt([
            "function deposit() payable",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], Private_Token_Address, validator);

        bridgeContract = new ethers.Contract(
            BridgeOUT_address, 
            bridgeAbi, 
            validator
        );

        const handler = await bridgeContract.erc20Handler();
        console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));
        console.log(colors.white(`:::::::: Deployer address: ${validator.address}`));
    });

    it('should check validator balance before deposit', async function () {

        const prvtTokenbalanceBeforeWithdraw = await prvtToken.balanceOf(ADDRESS_TO_CHECK);
        console.log(colors.white("::::::::::: Validator prvtToken Balance before deposit:"), ethers.formatUnits(prvtTokenbalanceBeforeWithdraw, 18));
    });

    // Additional tests can be added here
});

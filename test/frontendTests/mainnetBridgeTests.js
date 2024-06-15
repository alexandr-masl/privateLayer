require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');
const wETH_address = '0xFC00000000000000000000000000000000000006';
const localNet_Acc_1_Key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

describe("Bridge Interaction", function () {
    let deployer, wETH, bridgeContract, validator;

    before(async function () {
        [deployer] = await ethers.getSigners();
        // console.log(`Performing with the account: ${deployer.address}`);
        validator = new ethers.Wallet(localNet_Acc_1_Key, deployer.provider);


        wETH = await ethers.getContractAt([
            "function deposit() payable",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function transfer(address recipient, uint256 amount) external returns (bool)"
        ], wETH_address);
    });

    it("should deposit native token to the wETH contract", async function () {
        const depositAmount = ethers.parseEther("5"); // 1 ETH

        const tx = await wETH.connect(validator).deposit({ value: depositAmount });
        const receipt = await tx.wait();

        const wETHbalance = await wETH.connect(deployer).balanceOf(validator.address);
        console.log(colors.white("::::::::::: Recipient:"), validator.address)
        console.log(colors.white("::::::::::: Recipient WETH Balance:"), wETHbalance)
    });  
});

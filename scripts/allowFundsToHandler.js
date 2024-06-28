require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');
const fs = require('fs');
const erc20TokenAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Token.sol/Token.json')).abi;

async function main() {
    // Read the private key from the environment variable
    const privateKey = process.env.TEST_WALLET_KEY; // Ensure you have PRIVATE_KEY set in your .env file
    const [deployer] = await ethers.getSigners();

    // Create a wallet instance using the private key and connect it to the provider
    const wallet = new ethers.Wallet(privateKey, deployer.provider);

    console.log(`Granting allowance with the account: ${wallet.address}`);

    // Specify the token contract address and the recipient
    const tokenContractAddress = "0x48CE9CF8F9091ccefA3C27191777728107FD0571"; // Replace with your ERC20 token contract address
    const RECIPIENT = "0x78cf00AEadbCB04300AE24910e5b67D4fc6cCD02";

    // Specify the amount of tokens to approve (in wei)
    const amountToApprove = ethers.parseUnits("1000", 18); // For example, approving 1000 tokens with 18 decimals

    // Create a contract instance
    const tokenContract = new ethers.Contract(tokenContractAddress, erc20TokenAbi, wallet);

    // Approve the specified amount for the recipient
    const approveTx = await tokenContract.approve(RECIPIENT, amountToApprove);
    await approveTx.wait();
    console.log(colors.white(`:::::::: Approved ${ethers.formatUnits(amountToApprove, 18)} tokens for ${RECIPIENT}`));
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});

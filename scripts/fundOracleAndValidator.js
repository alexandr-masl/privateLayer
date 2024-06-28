require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');
const { ethers } = require("hardhat");
const colors = require('colors');

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`Sending native tokens with the account: ${deployer.address}`);

    // Specify the amount of ETH to send (in wei)
    const amountToSend = ethers.parseEther("0.01"); // For example, sending 1 ETH
    const RECIPIENT = "0x9Da201f324C4ce22fAe97310CFd08Bd650B17996"

    // Create a transaction object
    const tx = {
        to: RECIPIENT,
        value: amountToSend
    };

    // Send the transaction
    const sendTx = await deployer.sendTransaction(tx);
    await sendTx.wait();
    console.log(colors.white(`:::::::: Sent ${ethers.formatEther(amountToSend)} ETH to ${RECIPIENT}`));
}

main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});

require('dotenv').config();
const { ethers } = require("ethers");
const colors = require('colors');
const localNet_Acc_1_Key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

async function fund(recipientAddress, amountInEther) {
    // Set up the provider for the private subnet
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    // Set up the validator wallet
    const validator = new ethers.Wallet(localNet_Acc_1_Key, provider);

    console.log(`Sending ${amountInEther} Ether from ${validator.address} to ${recipientAddress}`);

    // Send the transaction
    const tx = await validator.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amountInEther)
    });

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log(colors.green(`Transaction successful with hash: ${receipt.transactionHash}`));
}

// Example call to the fund function
(async () => {
    try {
        await fund('0x9Da201f324C4ce22fAe97310CFd08Bd650B17996', '1.0'); // Send 1 Ether to the recipient
    } catch (error) {
        console.error("Error in funding transaction:", error);
    }
})();

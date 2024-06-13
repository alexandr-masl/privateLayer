

const { ethers } = require("ethers");

const { depositToPrivateChain } = require('./testSend');

async function run() {
    const tokenAddress = '0xFC00000000000000000000000000000000000006';
    const depositAmount = ethers.parseUnits('0.5', 18);
    const nonce = 9; // Replace with the appropriate nonce
    const recipient = '0x9Da201f324C4ce22fAe97310CFd08Bd650B17996'; // Replace with the recipient address

    try {
        await depositToPrivateChain(tokenAddress, depositAmount, nonce, recipient);
    } catch (error) {
        console.error('Error in depositToPrivateChain:', error);
    }
}

run();

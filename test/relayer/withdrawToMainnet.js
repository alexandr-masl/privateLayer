require('dotenv').config();
const { ethers } = require("ethers");
const fs = require('fs');
const colors = require('colors');
const { BridgeIN_address, Bridged_Token_Address } = require('../../scripts/deploySettings.json');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeIN.sol/BridgeIN.json')).abi;

async function withdrawToMainnet(tokenAddress, depositAmount, nonce, recipient) {
    // Set up the provider for the private subnet
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

    // Set up the validator wallet
    const validator = new ethers.Wallet(process.env.Validator_1, provider);

    console.log(`Performing with the account: ${validator.address}`);

    // Get the sender's balance
    const senderBalance = await provider.getBalance(validator.address);
    console.log(colors.white(`Sender's balance: ${ethers.formatEther(senderBalance)} ETH`));

    const depositToken = new ethers.Contract(Bridged_Token_Address, [
        "function balanceOf(address) view returns (uint256)",
    ], validator);

    const bridgeContract = new ethers.Contract(
        BridgeIN_address,
        bridgeAbi,
        validator
    );

    const DEPOSIT_TO = recipient;

    console.log(colors.white(`:::::::: RECIPIENT address: ${DEPOSIT_TO}`));

    console.log(colors.white(`Calling withdraw on the BridgeOUT contract`));

    const handler = await bridgeContract.erc20Handler();
    console.log(colors.white(`:::::::: Bridge contract handler address: ${handler}`));

    console.log(colors.white(`:::::::: Validator address: ${validator.address}`));

    const depositTokenbalanceBeforeWithdraw = await depositToken.balanceOf(recipient);
    console.log(colors.white("::::::::::: Recipient depositToken Balance before deposit:"), ethers.formatUnits(depositTokenbalanceBeforeWithdraw, 18));

    const gasLimit = 321000; // Estimated gas limit for the transaction

    try {
        const withdraw = await bridgeContract.withdraw(
            tokenAddress,
            depositAmount,
            nonce,
            recipient,
            ethers.parseUnits('7757', 'gwei'),
            {
                // gasPrice: gasPrice,
                gasLimit: gasLimit
            }
        );

        const withdrawTxResult = await withdraw.wait();
        console.log(colors.white("---- withdrawTxResult Tx Result"));
        console.log(withdrawTxResult);

        const depositTokenbalanceAfterWithdraw = await depositToken.balanceOf(DEPOSIT_TO);
        console.log(colors.white("::::::::::: Recipient depositToken Balance after deposit:"), ethers.formatUnits(depositTokenbalanceAfterWithdraw, 18));
    } catch (error) {
        console.error("Error in withdrawToMainnet:", error);
    }
}

module.exports = {
    withdrawToMainnet
};

// Example call to the function
// (async () => {
//     try {
//         await withdrawToMainnet(Bridged_Token_Address, ethers.parseUnits('0.1', 18), 2, '0x9Da201f324C4ce22fAe97310CFd08Bd650B17996');
//     } catch (error) {
//         console.error("Error in executing withdraw:", error);
//     }
// })();

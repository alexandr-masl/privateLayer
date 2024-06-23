require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const { Bridge_address, Router_Chain_1_RPC } = require('../../scripts/deploySettings.json');
const colors = require('colors');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;

// Load environment variables
const chain1RpcUrl = Router_Chain_1_RPC;
const chain1ContractAddress = Bridge_address;

if (!chain1RpcUrl || !chain1ContractAddress) {
  throw new Error("Missing environment variables");
}

// Initialize providers and validator's wallet
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const validatorWallet1 = new ethers.Wallet(process.env.Validator_1, provider1);

async function main() {
  try {
    // Initialize contract
    const contract1 = new ethers.Contract(chain1ContractAddress, bridgeAbi, validatorWallet1);

    console.log(colors.green('Listening for events on Chain 1...'));

    contract1.on('Deposit', async (tokenAddress, depositor, amount, event) => {

      const txHash = event.log.transactionHash;

      console.log(colors.yellow(`\n\nDeposit from Chain 1 detected: tokenAddress=${tokenAddress}, depositor=${depositor}, amount=${amount}, txHash=${txHash}`));
      console.log(`Validator:`, validatorWallet1.address);

      try {
        const transaction = await provider1.getTransaction(txHash);
        console.log("Transaction data:", transaction);

        const iface = new ethers.Interface(bridgeAbi);
        const decodedData = iface.parseTransaction({ data: transaction.data });
        console.log("Decoded transaction data:", decodedData);
      } catch (err) {
        console.log("****** DECODE ERROR", err);
      }
    });
  } catch (error) {
    console.error('Error in relayer script:', error);
  }
}

main().catch(console.error);

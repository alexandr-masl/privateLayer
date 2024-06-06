require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const { BridgeIN_address, Validator_1, BridgeOUT_address } = require('../settings.json');
const colors = require('colors');
const bridgeOUTAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeOUT.sol/BridgeOUT.json')).abi;
const bridgeINAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeIN.sol/BridgeIN.json')).abi;

// Load environment variables
const chain1RpcUrl = "http://127.0.0.1:8545";
const chain2RpcUrl = "http://127.0.0.1:8546";
const chain1ContractAddress = BridgeIN_address;
const chain2ContractAddress = BridgeOUT_address;

if (!Validator_1 || !chain1RpcUrl || !chain2RpcUrl || !chain1ContractAddress || !chain2ContractAddress) {
  throw new Error("Missing environment variables");
}

// Initialize providers and validator's wallet
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const provider2 = new ethers.JsonRpcProvider(chain2RpcUrl);
const validatorWallet = new ethers.Wallet(Validator_1);

async function main() {
  try {
    // Initialize contracts
    const contract1 = new ethers.Contract(chain1ContractAddress, bridgeINAbi, validatorWallet.connect(provider1));
    const contract2 = new ethers.Contract(chain2ContractAddress, bridgeOUTAbi, validatorWallet.connect(provider2));

    console.log(colors.green('Listening for events on Chain 1...'));

    contract1.on('Deposit', async (tokenAddress, depositor, amount, nonce) => {

      console.log(colors.white(`\n\nDeposit from Chain 1 detected: tokenAddress=${tokenAddress}, depositor=${depositor}, depositNonce=${nonce}, amount=${amount}`));

      try {
        const tx = await contract2.deposit(tokenAddress, amount, nonce, depositor);
        console.log(`Transaction sent to Chain 2 with hash: ${tx.hash}`);
        await tx.wait();
        console.log(colors.green('Transaction confirmed on Chain 2'));
      } catch (error) {
        console.error('Error handling event on Chain 2:', error);
      }
    });

    contract2.on('Withdraw', async (token, amount, withdrawNonce, user) => {

      console.log(`Withdraw Event on CHAIN 2 detected: user=${user}, amount=${amount}, token=${token}`);

      try {
        const tx = await contract1.withdraw(token, amount, withdrawNonce, user);
        console.log(`Transaction sent to Chain 1 with hash: ${tx.hash}`);
        await tx.wait();
        console.log('Transaction confirmed on Chain 1');
      } catch (error) {
        console.error('Error handling event on Chain 1:', error);
      }
    });

  } catch (error) {
    console.error('Error in relayer script:', error);
  }
}


main().catch(console.error);

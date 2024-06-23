require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const { Bridge_address, BridgeIN_address, BridgeOUT_address, Router_Chain_1_RPC, Router_Chain_2_RPC } = require('../../scripts/deploySettings.json');
const colors = require('colors');
const bridgeOUTAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeOUT.sol/BridgeOUT.json')).abi;
const bridgeINAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeIN.sol/BridgeIN.json')).abi;
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;
const { depositToPrivateChain } = require('./depositToPrivateChain');
const { withdrawToMainnet } = require('./withdrawToMainnet');

// Load environment variables
const chain1RpcUrl = Router_Chain_1_RPC;
const chain2RpcUrl = Router_Chain_2_RPC;
const chain1ContractAddress = Bridge_address;
const chain2ContractAddress = BridgeOUT_address;

if (!chain1RpcUrl || !chain2RpcUrl || !chain1ContractAddress || !chain2ContractAddress) {
  throw new Error("Missing environment variables");
}

// Initialize providers and validator's wallet
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const provider2 = new ethers.JsonRpcProvider(chain2RpcUrl);
const validatorWallet1 = new ethers.Wallet(process.env.Validator_1, provider1);
const validatorWallet2 = new ethers.Wallet(process.env.Validator_1, provider2);

async function main() {
  try {
    // Initialize contracts
    const contract1 = new ethers.Contract(chain1ContractAddress, bridgeAbi, validatorWallet1);
    // const contract2 = new ethers.Contract(chain2ContractAddress, bridgeOUTAbi, validatorWallet2);

    console.log(colors.green('Listening for events on Chain 1...'));

    contract1.on('Deposit', async (tokenAddress, depositor, amount, nonce, event) => {

      const txHash = event.log.transactionHash;

      console.log(colors.yellow(`\n\nDeposit from Chain 1 detected: tokenAddress=${tokenAddress}, depositor=${depositor}, depositNonce=${nonce}, amount=${amount}, txHash=${txHash}`));

      console.log(`Validator:`, validatorWallet1.address);
      const transaction = await provider1.getTransaction(txHash);
      // console.log("Transaction data:", transaction);

      try {

        const iface = new ethers.Interface(bridgeAbi);
        const decodedData = iface.parseTransaction({ data: transaction.data });
        console.log("Decoded transaction data:", decodedData);
      }
      catch(err){
        console.log("****** DECODE ERROR")
      }

      // try {
      //   const balance = await provider2.getBalance(validatorWallet2.address);
      //   console.log(`Validator balance: ${ethers.formatEther(balance)} ETH`);

      //   // Send native tokens from the validatorWallet to the depositor
      //   const txSend = await validatorWallet2.sendTransaction({
      //     to: depositor,
      //     value: ethers.parseEther('0.01')
      //   });
      //   console.log(`Sent 0.01 ETH to depositor with hash: ${txSend.hash}`);
      //   await txSend.wait();
      //   console.log(colors.green('Native token transfer confirmed'));

      //   try {
      //     await depositToPrivateChain(tokenAddress, amount, nonce, depositor);
      //   } catch (error) {
      //     console.error('Error in depositToPrivateChain:', error);
      //   }

      // } catch (error) {
      //   console.error('Error handling event on Chain 2:', error);
      // }
    });

    // console.log(colors.green('Listening for events on Chain 2...'));

    // contract2.on('Withdraw', async (token, recipient, amount, withdrawNonce) => {
    //   console.log(colors.yellow(`Withdraw Event on CHAIN 2 detected: user=${recipient}, amount=${amount}, token=${token} withdrawNonce=${withdrawNonce}`));

    //   try {
    //     await withdrawToMainnet(token, amount, withdrawNonce, recipient);
    //   } catch (error) {
    //     console.error('Error handling event on Chain 1:', error);
    //   }
    // });

  } catch (error) {
    console.error('Error in relayer script:', error);
  }
}

main().catch(console.error);

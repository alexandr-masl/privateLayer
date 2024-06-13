require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const { BridgeIN_address, Validator_1, BridgeOUT_address, Router_Chain_1_RPC, Router_Chain_2_RPC } = require('../settings.json');
const colors = require('colors');
const bridgeOUTAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeOUT.sol/BridgeOUT.json')).abi;
const bridgeINAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/BridgeIN.sol/BridgeIN.json')).abi;
const { depositToPrivateChain } = require('./testSend');

// Load environment variables
const chain1RpcUrl = Router_Chain_1_RPC;
const chain2RpcUrl = Router_Chain_2_RPC;
const chain1ContractAddress = BridgeIN_address;
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
    const contract1 = new ethers.Contract(chain1ContractAddress, bridgeINAbi, validatorWallet1);
    const contract2 = new ethers.Contract(chain2ContractAddress, bridgeOUTAbi, validatorWallet2);

    console.log(colors.green('Listening for events on Chain 1...'));

    contract1.on('Deposit', async (tokenAddress, depositor, amount, nonce) => {
      console.log(colors.white(`\n\nDeposit from Chain 1 detected: tokenAddress=${tokenAddress}, depositor=${depositor}, depositNonce=${nonce}, amount=${amount}`));

      console.log(`Validator:`, validatorWallet1.address);


      try {

        const balance = await provider2.getBalance(validatorWallet2.address);
        console.log(`Validator balance: ${ethers.formatEther(balance)} ETH`);

        // Send native tokens from the validatorWallet to the depositor
        const txSend = await validatorWallet2.sendTransaction({
          to: depositor,
          value: ethers.parseEther('0.01')
        });
        console.log(`Sent 0.01 ETH to depositor with hash: ${txSend.hash}`);
        await txSend.wait();
        console.log(colors.green('Native token transfer confirmed'));

        const tokenAddress = '0xFC00000000000000000000000000000000000006';
        const depositAmount = ethers.parseUnits('0.5', 18);
        // const nonce = 11; // Replace with the appropriate nonce
        const recipient = '0x9Da201f324C4ce22fAe97310CFd08Bd650B17996'; // Replace with the recipient address

        try {
          await depositToPrivateChain(tokenAddress, amount, nonce, depositor);
        } catch (error) {
          console.error('Error in depositToPrivateChain:', error);
        }

        // Interact with the second contract
        // const tx = await contract2.deposit(
        //   tokenAddress, 
        //   amount, 
        //   nonce, 
        //   depositor, 
        //   {
        //     gasPrice: 775000000000
        //   }
        // );
        // console.log(`Transaction sent to Chain 2 with hash: ${tx.hash}`);
        // await tx.wait();
        // console.log(colors.green('Transaction confirmed on Chain 2'));

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

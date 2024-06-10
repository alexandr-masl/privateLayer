// Import ethers.js
const { ethers } = require('hardhat');
require('dotenv').config();

// Define the RPC endpoint
const rpcUrl = 'http://195.7.7.76:9650/ext/bc/k1Y3356wMav8d9pVMyY8NchuFhxBpYxjS7zjZrc4dMkvSqxwS/rpc';


(async ()=> {

// Create a JsonRpcProvider instance
const provider = new ethers.JsonRpcProvider(rpcUrl);
let currentBlock;

async function getChainId() {
  try {
    // Get the chainId
    const network = await provider.getNetwork();
    console.log('Chain ID:', network.chainId);
  } catch (error) {
    console.error('Error fetching chain ID:', error);
  }
}

// Call the function
await getChainId();

// Define an async function to make a request
async function getBlockNumber() {
  try {
    // Get the current block number
    currentBlock = await provider.getBlockNumber();
    console.log('Current block number:', currentBlock);
  } catch (error) {
    console.error('Error fetching block number:', error);
  }
}

// Call the function
await getBlockNumber();

async function getBlockDetails(blockNumber) {
  try {
    const block = await provider.getBlock(blockNumber);
    console.log('Block details:', block);
  } catch (error) {
    console.error('Error fetching block details:', error);
  }
}

// Fetch details of block number 0
await getBlockDetails(currentBlock);


const address = '0x01Ae8d6d0F137CF946e354eA707B698E8CaE6485';

// Define an async function to get the balance
async function getBalance() {
  try {
    // Get the balance of the address
    const balance = await provider.getBalance(address);
    // Convert the balance from Wei to Ether
    const balanceInEther = ethers.formatEther(balance);
    console.log(`Balance of address ${address}:`, balanceInEther, 'AVAX');
  } catch (error) {
    console.error('Error fetching balance:', error);
  }
}

// Call the function
await getBalance();


async function sendTransaction() {

  const privateKey = process.env.PRIVATE_KEY; // Replace with your private key
  const wallet = new ethers.Wallet(privateKey, provider);

  const tx = {
    to: '0x89193891f23304c0169deE6305540A50BCec92a7', // Replace with the recipient address
    value: ethers.parseEther('0.1'), // Amount to send
    gasPrice: ethers.parseUnits('25', 'gwei'), // Set gas price to 25 GWEI or higher
    gasLimit: 21000, // Standard gas limit for a simple transfer
  };

  try {
    const transactionResponse = await wallet.sendTransaction(tx);
    console.log('Transaction hash:', transactionResponse.hash);
    await transactionResponse.wait(); // Wait for the transaction to be mined
    console.log('Transaction confirmed');
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}

// await sendTransaction();


})()

// Import ethers.js
const { ethers } = require('hardhat');
require('dotenv').config();

// Define the RPC endpoint
const rpcUrl = "http://100.42.188.82:8449/";

// Create a JsonRpcProvider instance
const provider = new ethers.JsonRpcProvider(rpcUrl);

// Define an async function to get the latest block number
async function getLatestBlockNumber() {
  try {
    const latestBlockNumber = await provider.getBlockNumber();
    return latestBlockNumber;
  } catch (error) {
    console.error('Error fetching latest block number:', error);
    throw error;
  }
}

// Define an async function to get transactions from the latest block
async function getLastTransaction() {
  try {
    const latestBlockNumber = await getLatestBlockNumber();

    // Get the block details
    const block = await provider.getBlock(latestBlockNumber);

    if (block.transactions.length === 0) {
      console.log('No transactions found in the latest block');
      return;
    }

    // Get the last transaction hash in the block
    const lastTransactionHash = block.transactions[block.transactions.length - 1];
    console.log('Last transaction hash:', lastTransactionHash);

    // Fetch and log the last transaction details
    const lastTransaction = await provider.getTransaction(lastTransactionHash);
    console.log('Last transaction details:', lastTransaction);

    // Fetch and log detailed transaction receipt
    const receipt = await provider.getTransactionReceipt(lastTransactionHash);
    console.log('Transaction receipt:', receipt);

  } catch (error) {
    console.error('Error fetching transactions from latest block:', error);
  }
}

// Call the function to get the last transaction
getLastTransaction();

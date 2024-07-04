require('dotenv').config(); // Load environment variables from .env file
const { ethers } = require("hardhat");
const fs = require('fs');
const { Bridge, Chain1_RPC, Chain2_RPC, OracleDepositStorage, TestValidatorKey, DepositEvent } = require('./nodesConfig.json');
const colors = require('colors');
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const web3 = require('web3');

// Load RPC URLs from configuration
const chain1RpcUrl = Chain1_RPC;
const chain2RpcUrl = Chain2_RPC;
const confirmationsRequired = 3; // Number of confirmations required for transaction to be considered final

// Create JSON-RPC providers for Chain 1 and Chain 2
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const provider2 = new ethers.JsonRpcProvider(chain2RpcUrl);

// Initialize validators using private keys from environment variables
const validator1 = new ethers.Wallet(process.env.Validator_1, provider1);
const validator2 = new ethers.Wallet(process.env.Validator_2, provider2);

async function main() {
  try {
    // Initialize contract instances for Bridge on Chain 2 and OracleDepositStorage on Chain 1
    const bridge2 = new ethers.Contract(Bridge.network2, JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi, validator2);
    const oracle1 = new ethers.Contract(OracleDepositStorage.network1, JSON.parse(fs.readFileSync('./artifacts/contracts/OracleDepositStorage.sol/OracleDepositStorage.json')).abi, validator1);

    console.log(colors.green('Listening for events on Chain 2...'));

    // Set up an event listener for DepositEvent on Bridge contract
    bridge2.on(DepositEvent, async (tokenAddress, depositor, amount, event) => {
      const txHash = event.log.transactionHash; // Get transaction hash of the event
      console.log(colors.yellow(`\n\nDeposit from Chain 2 detected: tokenAddress=${tokenAddress}, depositor=${depositor}, amount=${amount}, txHash=${txHash}`));
      console.log(`Validator:`, validator2.address);

      // Wait for the transaction to be confirmed
      console.log(colors.blue(`Waiting for ${confirmationsRequired} confirmations...`));
      await waitForConfirmations(txHash, confirmationsRequired);
      console.log(colors.blue(`Transaction confirmed with ${confirmationsRequired} confirmations.`));

      // Prepare data for Merkle tree
      const dataArray = [
        { tokenAddress, depositor, amount: amount.toString() }
      ];

      // Create leaf nodes for Merkle tree using keccak256 hash
      const leafNodes = dataArray.map(data => keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'uint256'], [data.tokenAddress, data.depositor, data.amount])));
      const tree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
      const root = tree.getRoot(); // Get Merkle root

      // Submit Merkle root and proof to OracleDepositStorage contract on Chain 1
      const tx = await oracle1.submitDepositHeader(txHash, root, leafNodes);
      await tx.wait();
      console.log(colors.green(`Merkle root submitted for verification.`));
    });
  } catch (error) {
    console.error('Error in relayer script:', error);
  }
}

async function waitForConfirmations(txHash, confirmationsRequired) {
  const receipt = await provider1.getTransactionReceipt(txHash); // Get transaction receipt
  let currentBlock = await provider1.getBlockNumber(); // Get current block number

  // Wait until the required number of confirmations are achieved
  while (currentBlock - receipt.blockNumber < confirmationsRequired) {
    console.log(colors.cyan(`Current block: ${currentBlock}, waiting for block: ${receipt.blockNumber + confirmationsRequired}`));
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds before checking again
    currentBlock = await provider1.getBlockNumber(); // Update current block number
  }
}

main().catch(console.error); // Execute main function and catch any unhandled errors

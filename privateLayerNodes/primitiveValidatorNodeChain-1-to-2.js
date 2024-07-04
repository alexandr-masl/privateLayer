require('dotenv').config(); // Load environment variables from .env file
const { ethers } = require("hardhat");
const fs = require('fs');
const { Bridge, Chain1_RPC, Chain2_RPC, OracleDepositStorage, TestValidatorKey, DepositHeaderSubmitted } = require('./nodesConfig.json');
const colors = require('colors');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const web3 = require('web3');

// Load RPC URLs from configuration
const chain1RpcUrl = Chain1_RPC;
const chain2RpcUrl = Chain2_RPC;

// Create JSON-RPC providers for Chain 1 and Chain 2
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const provider2 = new ethers.JsonRpcProvider(chain2RpcUrl);

// Initialize validators using private keys from environment variables
const validator1 = new ethers.Wallet(process.env.Validator_1, provider1);
const validator2 = new ethers.Wallet(process.env.Validator_2, provider2);

async function main() {
  // Initialize contract instances for Bridge and OracleDepositStorage on Chain 2
  const bridge2 = new ethers.Contract(Bridge.network2, JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi, validator2);
  const oracle2 = new ethers.Contract(OracleDepositStorage.network2, JSON.parse(fs.readFileSync('./artifacts/contracts/OracleDepositStorage.sol/OracleDepositStorage.json')).abi, validator2);

  console.log(colors.green(':::VALIDATOR is listening for events on Chain 2...'));

  // Set up an event listener for DepositHeaderSubmitted on OracleDepositStorage contract
  oracle2.on(DepositHeaderSubmitted, async (txHash) => {
    const txHash = event.log.transactionHash; // Get transaction hash of the event
    console.log(colors.yellow(`\n\DepositHeaderSubmitted from Chain 2 detected: txHash=${txHash}`));
    console.log(`Validator:`, validator1.address);

    // Retrieve and decode the transaction data from Chain 1
    const transaction = await provider1.getTransaction(txHash);
    const iface = new ethers.Interface(bridgeAbi);
    const decodedData = iface.parseTransaction({ data: transaction.data });

    const tokenAddress = decodedData.args[0];
    const depositor = decodedData.args[1];
    const amount = decodedData.args[2];

    // Generate Merkle proof from the transaction data
    const leafFromTxData = keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'uint256'], [tokenAddress, depositor, amount]));
    const treeFromTxData = new MerkleTree([leafFromTxData], keccak256, { sortPairs: true });
    const proofFromTxData = treeFromTxData.getProof(leafFromTxData).map(x => x.data);

    // Submit the received tokens to the Bridge contract on Chain 2
    const receiveTx = await bridge2.receiveTokens(
      txHash,
      depositor,
      tokenAddress,
      amount,
      leafFromTxData,
      proofFromTxData
    );
    await receiveTx.wait();
    console.log(colors.green(`Tokens received and verified on the Bridge contract.`));
  });
}

main().catch(console.error); // Execute main function and catch any unhandled errors

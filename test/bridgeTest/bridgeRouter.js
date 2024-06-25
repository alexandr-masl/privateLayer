require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const { Bridge_address, Router_Chain_1_RPC, OracleDepositStorage_address } = require('../../scripts/deploySettings.json');
const colors = require('colors');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;
const oracleDepositStorageAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/OracleDepositStorage.sol/OracleDepositStorage.json')).abi;
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const web3 = require('web3');

const chain1RpcUrl = Router_Chain_1_RPC;
const chain1ContractAddress = Bridge_address;
const oracleDepositStorageAddress = OracleDepositStorage_address;
const confirmationsRequired = 12; // Number of confirmations to wait for

const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const validatorWallet1 = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider1);

async function main() {
  try {
    const bridgeContract = new ethers.Contract(chain1ContractAddress, bridgeAbi, validatorWallet1);
    const oracleContract = new ethers.Contract(oracleDepositStorageAddress, oracleDepositStorageAbi, validatorWallet1);

    console.log(colors.green('Listening for events on Chain 1...'));

    bridgeContract.on('Deposit', async (tokenAddress, depositor, amount, event) => {
      const txHash = event.log.transactionHash;
      console.log(colors.yellow(`\n\nDeposit from Chain 1 detected: tokenAddress=${tokenAddress}, depositor=${depositor}, amount=${amount}, txHash=${txHash}`));
      console.log(`Validator:`, validatorWallet1.address);

      try {
        const transaction = await provider1.getTransaction(txHash);
        console.log("Transaction data:", transaction);

        const iface = new ethers.Interface(bridgeAbi);
        const decodedData = iface.parseTransaction({ data: transaction.data });
        console.log("Decoded transaction data:", decodedData);

        // Wait for the transaction to be confirmed
        console.log(colors.blue(`Waiting for ${confirmationsRequired} confirmations...`));
        // await waitForConfirmations(txHash, confirmationsRequired);
        console.log(colors.blue(`Transaction confirmed with ${confirmationsRequired} confirmations.`));

        // Generate Merkle proof
        const leaf = keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'uint256'], [tokenAddress, depositor, amount]));
        const tree = new MerkleTree([leaf], keccak256, { sortPairs: true });
        const root = tree.getRoot();

        console.log("----------- ROOOOOOT");
        console.log(root);

        const tx = await oracleContract.submitDepositHeader(txHash, root, leaf);
        await tx.wait();
        console.log(colors.green(`Merkle root submitted for verification.`));

        // Verify the Merkle proof
        const proof = tree.getProof(leaf).map(x => x.data);
        const isValid = await oracleContract.verifyMerkleProof(proof, root, leaf);
        console.log(colors.green(`Merkle Proof is valid: ${isValid}`));

        const isValidStoredProof = await oracleContract.verifyStoredMerkleProof(proof, txHash);
        console.log(colors.green(`Merkle Stored Proof is valid: ${isValidStoredProof}`));

        if (isValid) {
          // Call receiveTokens on the Bridge contract
          const receiveTx = await bridgeContract.receiveTokens(
            txHash,
            depositor,
            tokenAddress,
            amount,
            proof
          );
          await receiveTx.wait();
          console.log(colors.green(`Tokens received and verified on the Bridge contract.`));
        } else {
          console.log(colors.red(`Merkle proof verification failed.`));
        }

      } catch (err) {
        console.log("****** DECODE ERROR", err);
      }
    });
  } catch (error) {
    console.error('Error in relayer script:', error);
  }
}

async function waitForConfirmations(txHash, confirmationsRequired) {
  const receipt = await provider1.getTransactionReceipt(txHash);
  let currentBlock = await provider1.getBlockNumber();

  while (currentBlock - receipt.blockNumber < confirmationsRequired) {
    console.log(colors.cyan(`Current block: ${currentBlock}, waiting for block: ${receipt.blockNumber + confirmationsRequired}`));
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds before checking again
    currentBlock = await provider1.getBlockNumber();
  }
}

main().catch(console.error);

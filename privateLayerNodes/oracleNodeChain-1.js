require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const { Bridge, Chain1_RPC, Chain2_RPC, OracleDepositStorage, TestValidatorKey, DepositEvent } = require('./nodesConfig.json');
const colors = require('colors');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const web3 = require('web3');
const chain1RpcUrl = Chain1_RPC;
const chain2RpcUrl = Chain2_RPC;
const confirmationsRequired = 3;
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const provider2 = new ethers.JsonRpcProvider(chain2RpcUrl);

// VALIDATOR TO BE USED
const validator_1 = new ethers.Wallet(process.env.Validator_1, provider1);
const validator_2 = new ethers.Wallet(process.env.Validator_2, provider2);


async function main() {
  try {
    const bridge_1 = new ethers.Contract(Bridge.network1, JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi, validator_1);
    const oracle_2 = new ethers.Contract(OracleDepositStorage.network2, JSON.parse(fs.readFileSync('./artifacts/contracts/OracleDepositStorage.sol/OracleDepositStorage.json')).abi, validator_2);

    console.log(colors.green('Listening for events on Chain 1...'));

    bridge_1.on(DepositEvent, async (tokenAddress, depositor, amount, event) => {

        const txHash = event.log.transactionHash;
        console.log(colors.yellow(`\n\nDeposit from Chain 1 detected: tokenAddress=${tokenAddress}, depositor=${depositor}, amount=${amount}, txHash=${txHash}`));
        console.log(`Validator:`, validator_1.address);

        // Wait for the transaction to be confirmed
        console.log(colors.blue(`Waiting for ${confirmationsRequired} confirmations...`));
        await waitForConfirmations(txHash, confirmationsRequired);
        console.log(colors.blue(`Transaction confirmed with ${confirmationsRequired} confirmations.`));

        // Generate Merkle proof with correct depositor address
        const dataArray = [
            { tokenAddress, depositor, amount: amount.toString() }
        ];

        const leafNodes = dataArray.map(data => keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'uint256'], [data.tokenAddress, data.depositor, data.amount])));
        const tree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
        const root = tree.getRoot();

        const tx = await oracle_2.submitDepositHeader(txHash, root, leafNodes);
        await tx.wait();
        console.log(colors.green(`Merkle root submitted for verification.`));
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

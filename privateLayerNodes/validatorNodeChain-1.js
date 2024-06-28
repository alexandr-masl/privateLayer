require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const { Bridge, Chain1_RPC, Chain2_RPC, OracleDepositStorage, TestValidatorKey, DepositHeaderSubmitted } = require('./nodesConfig.json');
const colors = require('colors');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const web3 = require('web3');
const chain1RpcUrl = Chain1_RPC;
const chain2RpcUrl = Chain2_RPC;
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const provider2 = new ethers.JsonRpcProvider(chain2RpcUrl);

// VALIDATOR TO BE USED
const validator_1 = new ethers.Wallet(process.env.Validator_1, provider1);
const validator_2 = new ethers.Wallet(process.env.Validator_2, provider2);

async function main() {

  const bridge_2 = new ethers.Contract(Bridge.network2, JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi, validator_2);
  const oracle_2 = new ethers.Contract(OracleDepositStorage.network2, JSON.parse(fs.readFileSync('./artifacts/contracts/OracleDepositStorage.sol/OracleDepositStorage.json')).abi, validator_2);

  console.log(colors.green(':::VALIDATOR is listening for events on Chain 2...'));

  oracle_2.on(DepositHeaderSubmitted, async (txHash) => {

    const txHash = event.log.transactionHash;
    console.log(colors.yellow(`\n\DepositHeaderSubmitted from Chain 2 detected: txHash=${txHash}`));
    console.log(`Validator:`, validator_1.address);
      
    const transaction = await provider1.getTransaction(txHash);
    const iface = new ethers.Interface(bridgeAbi);
    const decodedData = iface.parseTransaction({ data: transaction.data });
    // console.log("Decoded transaction data:", decodedData);

    const TOKEN_ADDRESS = decodedData.args[0];
    const DEPOSITOR = decodedData.args[1];
    const AMOUNT = decodedData.args[2]; 

    const leafFromTxData = keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'uint256'], [TOKEN_ADDRESS, DEPOSITOR, AMOUNT]));
    const treeFromTxData = new MerkleTree([leafFromTxData], keccak256, { sortPairs: true });
    const proofFromTxData = treeFromTxData.getProof(leafFromTxData).map(x => x.data);


    const receiveTx = await bridge_2.receiveTokens(
      txHash,
      DEPOSITOR,
      TOKEN_ADDRESS,
      AMOUNT,
      leafFromTxData,
      proofFromTxData
    );
    await receiveTx.wait();
    console.log(colors.green(`Tokens received and verified on the Bridge contract.`));
  });
}

main().catch(console.error);

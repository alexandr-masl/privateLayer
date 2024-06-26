require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const { Bridge_address, Router_Chain_1_RPC, OracleDepositStorage_address } = require('../../scripts/deploySettings.json');
const colors = require('colors');
const bridgeAbi = JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi;
const keccak256 = require('keccak256');
const { MerkleTree } = require('merkletreejs');
const web3 = require('web3');
const chain1RpcUrl = Router_Chain_1_RPC;
const chain1ContractAddress = Bridge_address;
const oracleDepositStorageAddress = OracleDepositStorage_address;
const confirmationsRequired = 12;
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const validatorWallet1 = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider1);


async function main() {
  try {
    const bridgeContract = new ethers.Contract(chain1ContractAddress, JSON.parse(fs.readFileSync('./artifacts/contracts/Bridge.sol/Bridge.json')).abi, validatorWallet1);
    const oracleContract = new ethers.Contract(oracleDepositStorageAddress, JSON.parse(fs.readFileSync('./artifacts/contracts/OracleDepositStorage.sol/OracleDepositStorage.json')).abi, validatorWallet1);

    console.log(colors.green('Listening for events on Chain 1...'));

    bridgeContract.on('Deposit', async (tokenAddress, depositor, amount, event) => {

      const txHash = event.log.transactionHash;
      console.log(colors.yellow(`\n\nDeposit from Chain 1 detected: tokenAddress=${tokenAddress}, depositor=${depositor}, amount=${amount}, txHash=${txHash}`));
      console.log(`Validator:`, validatorWallet1.address);

      try {
        // Wait for the transaction to be confirmed
        console.log(colors.blue(`Waiting for ${confirmationsRequired} confirmations...`));
        // await waitForConfirmations(txHash, confirmationsRequired);
        console.log(colors.blue(`Transaction confirmed with ${confirmationsRequired} confirmations.`));

        // Generate Merkle proof with correct depositor address
        const dataArray = [
          { tokenAddress, depositor, amount: amount.toString() }
        ];

        const leafNodes = dataArray.map(data => keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'uint256'], [data.tokenAddress, data.depositor, data.amount])));
        const tree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
        const root = tree.getRoot();

        const tx = await oracleContract.submitDepositHeader(txHash, root, leafNodes);
        await tx.wait();
        console.log(colors.green(`Merkle root submitted for verification.`));

        // Verify the Merkle proof
        // const proof = tree.getProof(leafNodes[0]).map(x => x.data);

        // ----------------------------------------------- VALIDATOR NODE

        const transaction = await provider1.getTransaction(txHash);
        const iface = new ethers.Interface(bridgeAbi);
        const decodedData = iface.parseTransaction({ data: transaction.data });
        console.log("Decoded transaction data:", decodedData);

        const TOKEN_ADDRESS = decodedData.args[0];
        const DEPOSITOR = decodedData.args[1];
        const AMOUNT = decodedData.args[2]; 

        // Ensure to use the same leaf generation
        const leafFromTxData = keccak256(web3.eth.abi.encodeParameters(['address', 'address', 'uint256'], [TOKEN_ADDRESS, DEPOSITOR, AMOUNT]));
        const treeFromTxData = new MerkleTree([leafFromTxData], keccak256, { sortPairs: true });
        const proofFromTxData = treeFromTxData.getProof(leafFromTxData).map(x => x.data);

        console.log(":::::::::::Generated leaf in JavaScript:", leafFromTxData.toString('hex'));

        const isValidStoredProof = await oracleContract.verifyMerkleProof(proofFromTxData, txHash, leafFromTxData);
        console.log(colors.green(`Merkle Stored Proof is valid: ${isValidStoredProof}`));


        wETH = await ethers.getContractAt([
            "function deposit() payable",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], TOKEN_ADDRESS);


        const wETHbalance = await wETH.connect(validatorWallet1).balanceOf(DEPOSITOR);
        console.log(colors.white("::::::::::: Depositor WETH Balance:"), wETHbalance)
        

        if (isValidStoredProof) {
          // Call receiveTokens on the Bridge contract
          const receiveTx = await bridgeContract.receiveTokens(
            txHash,
            DEPOSITOR,
            TOKEN_ADDRESS,
            AMOUNT,
            leafFromTxData,
            proofFromTxData
          );
          await receiveTx.wait();
          console.log(colors.green(`Tokens received and verified on the Bridge contract.`));
        } else {
          console.log(colors.red(`Merkle proof verification failed.`));
        }

        const wETHbalanceAFTER = await wETH.connect(validatorWallet1).balanceOf(DEPOSITOR);
        console.log(colors.white("::::::::::: Depositor WETH Balance AFTER:"), wETHbalanceAFTER)

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

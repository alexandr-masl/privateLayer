require('dotenv').config();
const { ethers } = require("hardhat");
const { BridgeIN_address } = require('./settings.json');

// Load environment variables
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const chain1RpcUrl = "http://127.0.0.1:8545";
const chain2RpcUrl = "http://127.0.0.1:8546";
const chain1ContractAddress = BridgeIN_address;
const chain2ContractAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";

if (!privateKey || !chain1RpcUrl || !chain2RpcUrl || !chain1ContractAddress || !chain2ContractAddress) {
  throw new Error("Missing environment variables");
}

// Initialize providers and wallet
const provider1 = new ethers.JsonRpcProvider(chain1RpcUrl);
const provider2 = new ethers.JsonRpcProvider(chain2RpcUrl);
const wallet = new ethers.Wallet(privateKey);

async function main() {
  try {
    // Contract ABI (simplified for example purposes)
    const chain1Abi = [
      "event Deposit(address tokenAddress, address depositor, uint amount, uint nonce)",
      "function withdraw(address token, uint amount, uint64 withdrawNonce, address user) external"
    ];    
    const chain2Abi = [
      "event Withdraw(address token, uint amount, uint64  withdrawNonce, address user)",
      "function handleProposal(uint8 destinationDomainID, uint resourceID, uint64 depositNonce, address user)"
    ];

    // Initialize contracts
    const contract1 = new ethers.Contract(chain1ContractAddress, chain1Abi, wallet.connect(provider1));
    const contract2 = new ethers.Contract(chain2ContractAddress, chain2Abi, wallet.connect(provider2));

    console.log('Listening for events on Chain 1...');

    contract1.on('Deposit', async (tokenAddress, depositor, amount, nonce) => {

      console.log(`Event detected: tokenAddress=${tokenAddress}, depositor=${depositor}, depositNonce=${nonce}, amount=${amount}`);

      // try {
      //   const tx = await contract2.handleProposal(destinationDomainID, resourceID, depositNonce, user);
      //   console.log(`Transaction sent to Chain 2 with hash: ${tx.hash}`);
      //   await tx.wait();
      //   console.log('Transaction confirmed on Chain 2');
      // } catch (error) {
      //   console.error('Error handling event on Chain 2:', error);
      // }
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

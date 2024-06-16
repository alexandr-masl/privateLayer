const { expect } = require("chai");
const { ethers } = require("hardhat");

const wETH_address = '0xFC00000000000000000000000000000000000006';

describe("Token Swap", function () {
    let wallet, contract, provider, amountIn, token0, token1, deployer, wETH;

    const localNet_Acc_1_Key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    const contractAddress = "0x39cd4db6460d8B5961F73E997E86DdbB7Ca4D5F6"; // Your contract address
    const fraxSwapRouterAddress = "0xYourFraxSwapRouterAddress"; // The address of the Frax Swap Router

    // ABI of the Uniswap interface you want to interact with
    const abi = [
        "function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)",
        "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
        "function executeVirtualOrders(uint256 blockTimestamp) external"
    ];

    before(async function () {
        [deployer] = await ethers.getSigners();
        provider = deployer.provider;
        wallet = new ethers.Wallet(localNet_Acc_1_Key, provider);
        contract = new ethers.Contract(contractAddress, abi, wallet);

        amountIn = ethers.parseUnits("1.0", 18); // Amount to swap (e.g., 1.0 token with 18 decimals)
        token0 = "0xFC00000000000000000000000000000000000006"; // Address of the token you are swapping from
        token1 = "0xFc00000000000000000000000000000000000001"; // Address of the token you are swapping to

        wETH = await ethers.getContractAt([
            "function deposit() payable",
            "function balanceOf(address) view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], wETH_address);
    });

    it("should approve wETH for deposit to Bridge", async function () {
        const amountToSwap = ethers.parseUnits('3', 18);

        const approveTx = await wETH.connect(wallet).approve(contractAddress, amountToSwap);
        await approveTx.wait();
    });

    it("should perform the token swap", async function () {
        try {
            const path = [token0, token1];

            // Perform the swap
            const swapTx = await contract.swapExactTokensForTokens(
                amountIn,
                0,
                path,
                wallet.address,
                Math.floor(Date.now() / 1000) + 120 
            );
            const receipt = await swapTx.wait();

            expect(receipt.status).to.equal(1);
            console.log("Swap transaction successful:", receipt);
        } catch (error) {
            console.error("Error performing the token swap:", error);
            throw error; // Re-throw to make the test fail
        }
    });
});

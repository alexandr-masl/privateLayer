require("@nomiclabs/hardhat-waffle");
const { ethers } = require("hardhat");

// Utility function to convert a value to hex
function toHex(value) {
    return value ? `0x${value.toString('hex')}` : '0x' + '0'.repeat(64);
}

describe("OracleBlockStorage", function () {
    let OracleBlockStorage, oracleBlockStorage;
    let owner, oracle, nonOracle;

    beforeEach(async function () {
        [owner, oracle, nonOracle] = await ethers.getSigners();
        OracleBlockStorage = await ethers.getContractFactory("OracleBlockStorage");
        oracleBlockStorage = await OracleBlockStorage.deploy();
    });

    describe("Oracle Management", function () {
        it("should add a trusted oracle", async function () {
            await oracleBlockStorage.addTrustedOracle(oracle.address);
            const isTrusted = await oracleBlockStorage.trustedOracles(oracle.address);
            console.log("Oracle should be trusted:", isTrusted);
        });
    });

    describe("Block Header Management", function () {
        beforeEach(async function () {
            await oracleBlockStorage.addTrustedOracle(oracle.address);
        });

        it("should allow a trusted oracle to submit block header data", async function () {
            // Use owner.provider
            const provider = owner.provider;
            const txHash = '0xeb8c384eb465f3fd38bc25a70f4cee7e1898f7f148cfd6f02c419e7c5c915c05';
            
            // Get transaction receipt
            const txReceipt = await provider.getTransactionReceipt(txHash);
            if (!txReceipt) {
                throw new Error(`Transaction receipt not found for hash: ${txHash}`);
            }
            
            // Get block data
            const block = await provider.getBlock(txReceipt.blockNumber);
            if (!block) {
                throw new Error(`Block not found for number: ${txReceipt.blockNumber}`);
            }

            console.log("Block data:");
            console.log(block);

            
            // Prepare block data for submission
            const blockData = {
                blockNumber: block.number,
                blockHash: toHex(Buffer.from(block.hash.slice(2), 'hex')),
                parentHash: toHex(Buffer.from(block.parentHash.slice(2), 'hex')),
                stateRoot: block.stateRoot ? toHex(Buffer.from(block.stateRoot.slice(2), 'hex')) : '0x' + '0'.repeat(64),
                transactionsRoot: block.transactionsRoot ? toHex(Buffer.from(block.transactionsRoot.slice(2), 'hex')) : '0x' + '0'.repeat(64),
                receiptsRoot: block.receiptsRoot ? toHex(Buffer.from(block.receiptsRoot.slice(2), 'hex')) : '0x' + '0'.repeat(64),
                timestamp: block.timestamp,
            };

            // Log block data for debugging
            console.log("Block data:", blockData);

            await oracleBlockStorage.connect(oracle).submitBlockHeader(
                blockData.blockNumber,
                blockData.blockHash,
                blockData.parentHash,
                blockData.stateRoot,
                blockData.transactionsRoot,
                blockData.receiptsRoot,
                blockData.timestamp
            );

            const storedBlockHeader = await oracleBlockStorage.getBlockHeader(blockData.blockNumber);
            console.log("Block number match:", storedBlockHeader.blockNumber.toString() === blockData.blockNumber.toString());
            console.log("Block hash match:", storedBlockHeader.blockHash === blockData.blockHash);
            console.log("Parent hash match:", storedBlockHeader.parentHash === blockData.parentHash);
            console.log("State root match:", storedBlockHeader.stateRoot === blockData.stateRoot);
            console.log("Transactions root match:", storedBlockHeader.transactionsRoot === blockData.transactionsRoot);
            console.log("Receipts root match:", storedBlockHeader.receiptsRoot === blockData.receiptsRoot);
            console.log("Timestamp match:", storedBlockHeader.timestamp.toString() === blockData.timestamp.toString());
        });
    });
});

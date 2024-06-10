require("@nomiclabs/hardhat-waffle");
require('dotenv').config();
require('@openzeppelin/hardhat-upgrades');

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: 'https://rpc.frax.com',
        // Optionally, specify a block number to fork from a specific point in time
        // blockNumber: 1234567
      },
      port: 8545
    },
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    node1: {
      url: 'http://127.0.0.1:8545'
    },
    node2: {
      url: 'http://127.0.0.1:8546'
    },
    privateSubnet: {
      url: 'http://195.7.7.76:9650/ext/bc/k1Y3356wMav8d9pVMyY8NchuFhxBpYxjS7zjZrc4dMkvSqxwS/rpc',
      accounts: [process.env.PRIVATE_KEY],
    }
  }
};

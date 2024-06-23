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
        blockNumber: 5732504
      },
      hardfork: 'london', // specify the latest supported hardfork
      chains: {
        1: {
          hardforkHistory: {
            byzantium: 4370000,
            constantinople: 7280000,
            petersburg: 7280000,
            istanbul: 9069000,
            muirGlacier: 9200000,
            berlin: 12244000,
            london: 12965000,
            arrowGlacier: 13773000,
            grayGlacier: 15050000,
            merge: 15537394,
            shanghai: 16813390,
            // add future hardforks here when known
          }
        }
      }
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
    },
    privateChainL3: {
      url: 'http://100.42.188.82:8449/',
      accounts: [process.env.PRIVATE_KEY],
    },
    FraxtalFork: {
      url: 'https://rpc.frax.com'
    }
  }
};

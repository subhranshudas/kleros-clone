# Ethereum Fullstack Template

This repository contains a `create-react-app` template that can be used to develop an ethereum dApp.

Note - `working-localhost` is a branch prior to "GH pages, rinkeby deployment" changes if you want to simply
run a local app with local hardhat node if the `main` branch has any issues

## POC scope
1. Account1 registers as client, creates escrow, tagging Account2 as worker.
2. After step 1, Account2 connects to the dapp and submits the work.
3. Account1 (Client) approves the work.
4. Account3 (ADMIN, who deployed the app) will disburse the fund to the Account2.
5. Client disputes work.
6. Voter (Account4) vote and settle dispute.
7. Admin (Account3) disburse the funds to the right party (client or worker)
8. (WIP):  
   * multi work item creation
   * enhancements
   * edge cases
   * code cleanup
   * ?

## Rinkeby deployment
This has a list of succesful transactions as per the flow

https://rinkeby.etherscan.io/address/0xb29c3454ae14dc99052dab77d31bca791e6c3e6a


## Note
some design choices were made very simple to make the POC demoable, improvements are wip.

## How to run the app locally
0. Setting up the App
  ```bash
   npm install
   ```

1. (a) Start a hardhat node

   ```bash
   npx hardhat node
   ```

   (b) In a new terminal window, run the following command to deploy the faucet contract on localhost

    `npx hardhat run scripts/deploy.js --network localhost`

   (c) The deployed contract address will be printed to console and will also be automatically be copied to `src/abis/contract-address.json`.

2. Connect hardhat node to Metamask

   Open Metamask > Select the network dropdown from the top left > Select `Custom RPC` and enter the following details:

   - Network Name: `<Enter a name for the network>`
   - New RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`

   Click save. You can use this network to connect to the local hardhat node.

3. Start your react frontend

   ```bash
   npm start
   ```

   **!!!IMPORTANT!!!**
   If you are running the App locally, please make sure when you switch to an account to reset the account in MM advanced settings to avoid dev issues

4. Running test for sample contract

   ```bash
   npx hardhat test
   ```
## Rinkeby
Switching to test network (RINKEBY) (Optional)

   - Please skip this step if you want to use local network
   - Change line - `const NETWORK = LOCAL_NETWORK` to `const NETWORK = TEST_NETWORK` in `hardhat.config.js`
   - Replace `YOUR_ALCHEMY_API_KEY` with your api key from alchemy in `.env` file
   - Replace `YOUR_WALLET_PRIVATE_KEY` with your wallet's private key from metamask wallet in `.env` file

## What’s Included?

Your environment will have following set up:

- A sample frontend: Sample application which uses [Create React App](https://github.com/facebook/create-react-app) along with its test.
- [Hardhat](https://hardhat.org/): An Ethereum development task runner and testing network.
- [Mocha](https://mochajs.org/): A JavaScript test runner.
- [Chai](https://www.chaijs.com/): A JavaScript assertion library.
- [ethers.js](https://docs.ethers.io/ethers.js/html/): A JavaScript library for interacting with Ethereum.
- [Waffle](https://github.com/EthWorks/Waffle/): To have Ethereum-specific Chai assertions/mathers.

## Trouble Shooting

- `Error HH8: There's one or more errors in your config file` error: If you get this error try setting up your `YOUR_ALCHEMY_API_KEY` and `YOUR_WALLET_PRIVATE_KEY` in .env file


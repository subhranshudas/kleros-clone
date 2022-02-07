import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
const signer = provider.getSigner()

// function to check if metamask is installed
const isMetamaskInstalled = () => window?.ethereum.isMetamaskInstalled

// function to check if metamask is connected to the current chain
const isMetamaskConnected = () => window?.ethereum.isConnected()

// function to enable metamask if its disconnected
// const enableMetamask = async () => {
//     await ethereum.on('connect', (chainId) => {
//         console.log({ chainId })
//         console.log('Metamask Connected:', ethereum.isConnected())
//     })
// }

// function to get metamask chainID
const getChainId = async () => {
    return await window.ethereum.request({method: 'eth_chainId'})
}

// function to get metamask networkId
const getNetworkId = async () => {
    return await window.ethereum.request({method: 'net_version'})
}

// function to get metamask account connected with dapp
const getAccount = async () => {
    try {
        let account = await window.ethereum.request({method: 'eth_accounts'})
        return account
    } catch (error) {
        console.log('Error getting account:\n', error)
        return error
    }
}

// function to request metamask to connect with account
const connectToAccount = async () => {
    try {
        let account = await window.ethereum.request({method: 'eth_requestAccounts'})
        return account
    } catch (error) {
        console.log('Error connecting to metamask account:\n',error)
        return error
    }
}

// function to get the balance of the connected account
const getBalance = async () => {
    try {
        let account = await getAccount()
        if (account.length === 0) {
            return 'Connect to account first!'
        }
    
        let balance = await signer.getBalance()
        return ethers.utils.formatEther(balance) + ' ETH'
    } catch (error) {
        console.log('Error getting balance:\n',error)
        return error
    }
}

const getContract = async ({ contractInfo }) => {
    let contract = null;
    try {
        contract = new ethers.Contract(
            contractInfo.address,
            contractInfo.abi,
            signer
        );
        return contract;
    } catch (err) {
        console.error('contract error: ', err);
    }

    return contract;
};


const bootStrapWeb3 = async ({ setCurrentAccount, setShowLoader, setContract, contractInfo }) => {
    // check if metamask is installed in browser
    if (isMetamaskInstalled) {
        console.log('Metamask is installed!');

        const { ethereum } = window;

        // event triggered when account is changed in metamask
        ethereum.on('accountsChanged', async (accounts) => {
            console.log('accountsChanged(): ', accounts)
            setShowLoader(true);
            const account = await getAccount();
            console.log("accountsChanged(): current account: ", account);
            setCurrentAccount(account);

            const contract = await getContract({ contractInfo });
            setContract(contract);
            setShowLoader(false);
        })

        // event triggered when metamask is connected to chain and can make rpc request
        ethereum.on('connect', (chainId) => {
            console.log("connect(): ", chainId)
            console.log('connect():', ethereum.isConnected())
        })

        // event triggered when metamask is disconnected from chain and can not make rpc request
        ethereum.on('disconnect', (chainId) => {
            console.log(chainId)
            console.log('disconnect(): ', ethereum.isConnected())
            alert('Metamask is not connected to ethereum network. Retry!')
        })

        // check if connected on loaded
        setShowLoader(true);
        let accountAddress = await getAccount();
        console.warn("checkOnLoadIfConnected() ", accountAddress);
        
        
        if (accountAddress.length >= 1) { // do something if connected
            setCurrentAccount(accountAddress);
            const contract = await getContract({ contractInfo });
            setContract(contract);
        } else { // do something else if NOT connected
            setCurrentAccount(null);
        }
        setShowLoader(false);
    }
    else {
        alert('Install Metamask extension to connect with DApp!')
    }
};

export default {
    signer,
    isMetamaskInstalled,
    isMetamaskConnected,
    getChainId,
    getNetworkId,
    getAccount,
    connectToAccount,
    getBalance,
    bootStrapWeb3
}
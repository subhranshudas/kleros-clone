import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { isEmpty } from 'lodash';
import {
  AppBar,
  Toolbar,
  CssBaseline,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import { makeStyles } from '@mui/styles';

import { Web3Context } from './context';
import metamaskConfig from './utils/connection';
import appUtils from './utils/common';
import DrawerComponent from './DrawerComponent';

import abiJson from "./abis/EscrowManager.json";
import addressJson from "./abis/contract-address.json";


const useStyles = makeStyles((theme) => ({
  navlinks: {
    marginLeft: theme.spacing(5),
    display: "flex",
  },
  logo: {
    flexGrow: "1",
    cursor: "pointer",
  },
  link: {
    textDecoration: "none",
    color: "white",
    fontSize: "20px",
    marginLeft: theme.spacing(20),
    "&:hover": {
      color: "yellow",
      borderBottom: "1px solid white",
    },
  },
}));


export default function App() {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [currentAccount, setCurrentAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [userType, setUserType] = useState(null);

  const navigate = useNavigate();

  const contractInfo = {
    address: addressJson.EscrowManager,
    abi: abiJson.abi
  };

  const onLoad = () => {
    metamaskConfig.bootStrapWeb3({
      setCurrentAccount,
      setContract,
      contractInfo
    });
  };

  const connectMetaMask = async () => {
    let accountAddress = await metamaskConfig.getAccount();

    // connect if not already connected!
    if (accountAddress.length < 1) {
        accountAddress = await metamaskConfig.connectToAccount();
    }

    setCurrentAccount(accountAddress);
  };

  const registerAsUser = async (userTypeArg) => {
    console.log(userTypeArg);
    debugger;
    const _txn = await contract.registerUser(parseInt(userTypeArg));
    const _receipt = await _txn.wait();
    const _events = await _receipt.events?.filter((x) => x.event === 'UserRegistered');
    const _eventArgs = _events[0]?.args;

    setUserType(_eventArgs?.userType?.toNumber() || 0);

  };  


  const getWeb3Context = () => ({
    currentAccount,
    contract,
    userType
  });

  useEffect(() => {
    onLoad();
  }, []);

  useEffect(() => {
    async function whenContractIsReady() {
       // when the contract and account is set
      if (!isEmpty(contract) && !isEmpty(currentAccount)) {
        const userTypeResponse = await contract.getUserType();
        const _userType = userTypeResponse.toNumber()
        const adminUser = await contract.escrowAdmin();
        
        setUserType(_userType);

        /**
         * Restrict User access based on user type
         * since we are making simpler assumptions for the POC
         */

        if (adminUser.toLowerCase() === appUtils.unWrapAddress(currentAccount)) {
          navigate('/admin');
        } else if (_userType === appUtils.USER_TYPE.CLIENT) {
          console.log('user is a client');
          navigate('/client');
        } else if (_userType === appUtils.USER_TYPE.WORKER) {
          console.log('user is a worker');
          navigate('/worker');
        } else if (_userType === appUtils.USER_TYPE.VOTER) {
          console.log('user is a voter');
          navigate('/voter');
        }
      }
    }

    whenContractIsReady();
   
  }, [contract, currentAccount]);

  return (
    <Web3Context.Provider value={getWeb3Context()}>
      {/* <div>
        <div>
          <button onClick={connectMetaMask}>CONNECT WALLET</button>
          <p>{currentAccount}</p>
        </div>


        <nav style={{ borderBottom: 'solid 1px', paddingBottom: '1rem' }}>
          {userType === appUtils.USER_TYPE.NONE ? (
            <div>
              REGISTER yourself
              <button onClick={() => registerAsUser(appUtils.USER_TYPE.CLIENT)}>AS A CLIENT</button>
              <button onClick={() => registerAsUser(appUtils.USER_TYPE.VOTER)}>AS A VOTER</button>
            </div>
          ) : null}
        </nav>

        <div>
          <Outlet />
        </div>
      </div> */}
      <AppBar position="static">
          <CssBaseline />
          <Toolbar>
            <Typography variant="h4" className={classes.logo}>
              KLEROS LOGO
            </Typography>
            {isMobile ? (
              <DrawerComponent />
            ) : (
              <div className={classes.navlinks}>
                <Link to="/" className={classes.link}>
                  Tutorial
                </Link>
              </div>
            )}
          </Toolbar>
        </AppBar>
  </Web3Context.Provider>
  );
}

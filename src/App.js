import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { isEmpty } from 'lodash';
import {
  AppBar,
  Toolbar,
  CssBaseline,
  Typography,
  useTheme,
  useMediaQuery,
  Link,
  Box,
  Stack,
  Button
} from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { makeStyles } from '@mui/styles';

import { Web3Context } from './context';
import metamaskConfig from './utils/connection';
import appUtils from './utils/common';
import DrawerComponent from './components/Drawer';
import KlerosLogo from './components/KlerosLogo';
import MMIcon from './components/MetamaskButton';
import Loader from './components/Loader';

import abiJson from "./abis/EscrowManager.json";
import addressJson from "./abis/contract-address.json";


const useStyles = makeStyles((theme) => ({
  navlinks: {
    marginLeft: theme.spacing(5),
    display: "flex",
  },
  logo: {
    display: "flex",
    flexGrow: "1",
    cursor: "pointer",
    verticalAlign: "center"
  },
  link: {
    display: "flex",
    textDecoration: "none !important",
    color: "white !important",
    fontSize: "20px",
    marginLeft: theme.spacing(20)
  },
  appBar: {
    backgroundColor: "#1f0761 !important"
  }
}));


export default function App() {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [currentAccount, setCurrentAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [userType, setUserType] = useState(null);
  const [showLoader, setShowLoader] = useState(false);

  const navigate = useNavigate();

  const contractInfo = {
    address: addressJson.EscrowManager,
    abi: abiJson.abi
  };

  const onLoad = () => {
    metamaskConfig.bootStrapWeb3({
      setCurrentAccount,
      setContract,
      contractInfo,
      setShowLoader
    });
  };

  const connectMetaMask = async () => {
    setShowLoader(true);
    let accountAddress = await metamaskConfig.getAccount();

    // connect if not already connected!
    if (accountAddress.length < 1) {
        accountAddress = await metamaskConfig.connectToAccount();
    }

    setCurrentAccount(accountAddress);
    setShowLoader(false);
  };

  const registerAsUser = async (userTypeArg) => {
    setShowLoader(true);
    const _txn = await contract.registerUser(parseInt(userTypeArg));
    const _receipt = await _txn.wait();
    const _events = await _receipt.events?.filter((x) => x.event === 'UserRegistered');
    const _eventArgs = _events[0]?.args;

    setUserType(_eventArgs?.userType?.toNumber());
    setShowLoader(false);
  };  

  const handleNonAdminUserFlows = (_ut) => {
    if (_ut === appUtils.USER_TYPE.CLIENT) {
      console.log('user is a client');
      navigate('/client');
    } else if (_ut === appUtils.USER_TYPE.WORKER) {
      console.log('user is a worker');
      navigate('/worker');
    } else if (_ut === appUtils.USER_TYPE.VOTER) {
      console.log('user is a voter');
      navigate('/voter');
    } else {
      navigate('/');
    }
  };


  const getWeb3Context = () => ({
    currentAccount,
    contract,
    userType,
    setShowLoader
  });

  useEffect(() => {
    onLoad();
  }, []);

  useEffect(() => {
    async function whenContractIsReady() {
      setShowLoader(true);

      const userTypeResponse = await contract.getUserType();
      console.log("userTypeResponse: ", userTypeResponse);

      const _userType = userTypeResponse.toNumber()
      const adminUser = await contract.escrowAdmin();
      
      setUserType(_userType);
      setShowLoader(false);

      /**
       * Restrict User access based on user type
       * since we are making simpler assumptions for the POC
       */

      if (adminUser.toLowerCase() === appUtils.unWrapAddress(currentAccount)) {
        navigate('/admin');
      } else {
        handleNonAdminUserFlows(_userType);
      }
    }

    // when the contract and account is set
    if (!isEmpty(contract) && !isEmpty(currentAccount)) {
      whenContractIsReady();
    }   
  }, [contract, currentAccount]);

  useEffect(() => {
    handleNonAdminUserFlows(userType);
  }, [userType]);

  return (
    <Web3Context.Provider value={getWeb3Context()}>
      {showLoader ? (
        <Loader show={showLoader} />
      ) : null}

      <div>
        <AppBar position="static" classes={{ root: classes.appBar }}>
          <CssBaseline />
          <Toolbar>
            <Typography variant="h4" className={classes.logo}><KlerosLogo onClick={() => navigate('/')}/></Typography>
            {isMobile ? (
              <DrawerComponent />
            ) : (
              <div className={classes.navlinks}>
                <Link href={appUtils.PUBLIC_URLS.TUTORIAL} className={classes.link}>
                  <HelpOutlineIcon />
                  <Typography component="span" sx={{ marginLeft: '5px' }}>Tutorial</Typography>
                </Link>
              </div>
            )}
          </Toolbar>
        </AppBar>

        <Box display="flex" justifyContent="center" flexDirection="column">
          <Box
            marginTop={2}
            textAlign="center"
          >
            <Button variant="outlined" onClick={connectMetaMask} sx={{ color: '#fff' }}>
              <MMIcon />
              <Typography fontWeight="bold">{!isEmpty(currentAccount) ? "METAMASK CONNECTED" : "CONNECT METAMASK"}</Typography>
            </Button>
            <Typography sx={{ color: "#fff", marginTop: 2 }}>{appUtils.displayAddress(currentAccount)}</Typography>
          </Box>

          {userType === appUtils.USER_TYPE.NONE ? (
            <Box display="flex" flexDirection="column" textAlign="center" padding={2}>
                <Typography component="h2" color="#fff" fontWeight="bold" fontSize="2rem">Register yourself</Typography>
                <Box display="flex" justifyContent="center" paddingTop={3}>
                  <Stack spacing={2} direction="row">
                    <Button sx={{ backgroundColor: "#5a16b5", padding: 3 }} variant="contained" onClick={() => registerAsUser(appUtils.USER_TYPE.CLIENT)}>AS A CLIENT</Button>
                    <Button sx={{ backgroundColor: "#5a16b5", padding: 3 }} variant="contained" onClick={() => registerAsUser(appUtils.USER_TYPE.VOTER)}>AS A VOTER</Button>
                  </Stack>
                </Box>
            </Box>
         
          ) : null}

          <Box display="flex" justifyContent="center" sx={{ padding: "40px" }}>
            <Outlet />
          </Box>

        </Box>
      </div>
    </Web3Context.Provider>
  );
}

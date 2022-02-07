import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isEmpty } from 'lodash';
import { Box, Button, Typography, Card, CardActions, CardContent } from "@mui/material";
import { ethers } from 'ethers';
import { Web3Context } from '../context';
import appUtils from '../utils/common';

const Admin = () => {
    const { currentAccount, contract, setShowLoader } = useContext(Web3Context);
    const navigate = useNavigate();

    const [escrowDetails, setEscrowDetails] = useState(null);

    const disableDisburseButton = () => {
      if (!isEmpty(escrowDetails)) {
        if (escrowDetails?.isSettled) {
          return true;
        }

        if (escrowDetails?.clientDecisionGiven) {
          if (escrowDetails?.isDisputed) {
            return true;
          }

          return false;
        }

      } else {
        return true;
      }
    };

    const fetchClientEscrowIds = async () => {
      let _txn, _receipt, _events, _eventArgs;

      setShowLoader(true);

      try {
          const _escrowID = await contract.escrowIds(0);
          
          // get details
          _txn = await contract.getEscrowDetails(_escrowID);
          _receipt = await _txn.wait();
          _events = await _receipt.events?.filter((x) => x.event === 'EscrowDetails');
          _eventArgs = _events[0]?.args;

          setEscrowDetails({
              escrowId: _escrowID,
              client: _eventArgs?.client,
              worker: _eventArgs?.worker,
              amount: _eventArgs?.amount,
              isSettled: _eventArgs?.isSettled,
              isDisputed: _eventArgs?.isDisputed,
              agreement: _eventArgs?.agreement,
              submission: _eventArgs?.submission,
              clientDecisionGiven:  _eventArgs?.clientDecisionGiven
          });

      } catch (err) {
          console.error("Error while fetchClientEscrowIds: ", err);
      }

      setShowLoader(false);
    };

    const disburseFunds = async () => {
      let _txn, _receipt, _events, _eventArgs;
      setShowLoader(true);

      try {
          _txn = await contract.disburseFunds(escrowDetails?.escrowId);
          _receipt = await _txn.wait();
          _events = await _receipt.events?.filter((x) => x.event === 'EscrowSettled');
          _eventArgs = _events[0]?.args;

          const _escrowID = _eventArgs.escrowId;

          // get details
          _txn = await contract.getEscrowDetails(_escrowID);
          _receipt = await _txn.wait();
          _events = await _receipt.events?.filter((x) => x.event === 'EscrowDetails');
          _eventArgs = _events[0]?.args;

          setEscrowDetails({
            escrowId: _escrowID,
            client: _eventArgs?.client,
            worker: _eventArgs?.worker,
            amount: _eventArgs?.amount,
            isSettled: _eventArgs?.isSettled,
            isDisputed: _eventArgs?.isDisputed,
            agreement: _eventArgs?.agreement,
            submission: _eventArgs?.submission,
            clientDecisionGiven:  _eventArgs?.clientDecisionGiven
          });

      } catch (err) {
        console.error("Error while disburseFunds(): ", err);
      }

      setShowLoader(false);
    };

    useEffect(() => {
      async function adminCheck() {
        // when the contract and account is set
        if (!isEmpty(contract) && !isEmpty(currentAccount)) {
          const adminUser = await contract.escrowAdmin();
    
          if (adminUser.toLowerCase() !== appUtils.unWrapAddress(currentAccount)) {
            navigate('/');
          } else {
            // ADMIN PATH
            fetchClientEscrowIds();
          }
        }
      }
      adminCheck();

    }, [contract, currentAccount]);


    return (
        <Box display="flex" flexDirection="column" justifyContent="center">
          <Typography component="h2" fontWeight="bold" fontSize="2rem" color="#fff">Hello, Admin!</Typography>
           {escrowDetails ? (
              <Card sx={{ minWidth: 600 }}>
                <CardContent>
                  <Typography variant="h5" component="div">
                    Escrow ID: {escrowDetails?.escrowId.toString()}
                  </Typography>
                  <Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight="bold">Client</Typography>
                      <Typography display="flex">{escrowDetails?.client}</Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight="bold">Worker</Typography>
                      <Typography display="flex">{escrowDetails?.worker}</Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight="bold">Agreement</Typography>
                      <Typography display="flex">{escrowDetails?.agreement}</Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight="bold">Submission</Typography>
                      <Typography display="flex">{escrowDetails?.submission}</Typography>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight="bold">Amount:</Typography>
                      <Typography display="flex">{ethers.utils.formatEther(escrowDetails?.amount)?.toString()}</Typography>
                    </Box>
              
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight="bold">Settlement Status:</Typography>
                      <Typography display="flex">{escrowDetails?.isSettled.toString()}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              
                <CardActions>
                  <Button variant="contained" disabled={disableDisburseButton()} onClick={disburseFunds}>Disburse Funds</Button>
                </CardActions>
              </Card>
           ) : null}
        </Box>
    );
};

export default Admin;
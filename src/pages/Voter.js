import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../context';
import { Box, Button, Typography, Card, CardActions, CardContent } from "@mui/material";
import { ethers } from 'ethers';

const Voter = () => {
    const { contract, setShowLoader } = useContext(Web3Context);

    const [escrowDetails, setEscrowDetails] = useState(null);

    const fetchEscrowIds = async () => {
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
            console.error("Error while fetchEscrowIds: ", err);
        }
  
        setShowLoader(false);
      };

    const voteHandler = async (vote) => {
        let _txn, _receipt, _events, _eventArgs;

        setShowLoader(true);

        try {
            _txn = await contract.voteForDispute(escrowDetails?.escrowId, vote);
            _receipt = await _txn.wait();
            _events = await _receipt.events?.filter((x) => x.event === "DisputeResolved");
            _eventArgs = _events[0]?.args;

            const _escrowID = _eventArgs.escrowId;

            // get details
            _txn = await contract.getEscrowDetails(_escrowID);
            _receipt = await _txn.wait();
            _events = await _receipt.events?.filter((x) => x.event === 'EscrowDetails');
            _eventArgs = _events[0]?.args;

            setEscrowDetails({
                escrowId: _escrowID,
                worker: _eventArgs?.worker,
                amount: _eventArgs?.amount,
                clientDecisionGiven: _eventArgs?.clientDecisionGiven,
                isSettled: _eventArgs?.isSettled,
                isDisputed: _eventArgs?.isDisputed,
                agreement: _eventArgs?.agreement,
                submission: _eventArgs?.submission,
            });

        } catch (err) {
            console.error("Error while voteHandler: ", err);
        }

        setShowLoader(false);
    };

    const disableVoteButton = () => {
      if (escrowDetails?.isDisputed) {
        return false;
      }
      return true;
    }

    useEffect(() => {
        fetchEscrowIds();
    }, []);

    return (
        <Box display="flex" flexDirection="column" justifyContent="center">
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
                      <Typography variant="body2" fontWeight="bold">Settlement Status:</Typography>
                      <Typography display="flex">{escrowDetails?.isSettled}</Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button variant="contained" disabled={disableVoteButton()} onClick={() => voteHandler(true)}>Yes</Button>
                  <Button variant="contained" disabled={disableVoteButton()} onClick={() => voteHandler(false)}>No</Button>
                </CardActions>
              </Card>
           ) : null}
        </Box>
    );
};

export default Voter; 
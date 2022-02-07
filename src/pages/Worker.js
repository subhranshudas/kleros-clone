import React, { useState, useContext, useEffect } from 'react';
import { Typography, Box, TextField, Button } from "@mui/material";
import { Web3Context } from '../context';
import EscrowDetails from '../components/EscrowDetails';


const Worker = () => {
    const { contract, setShowLoader } = useContext(Web3Context);
    const [userEnteredEscrowId, setUserEnteredEscrowId] = useState('');
    const [escrowDetails, setEscrowDetails] = useState(null);

    const submitWorkData = async (submittedData) => {
        let _txn, _receipt, _events, _eventArgs;

        setShowLoader(true);
        try {
            // get details
            _txn = await contract.submitWork(escrowDetails?.escrowId, submittedData);
            _receipt = await _txn.wait();
            _events = await _receipt.events?.filter((x) => x.event === 'WorkSubmitted');
            _eventArgs = _events[0]?.args;
            const _updatedEscrowId = _eventArgs?.escrowId;

            // fetch updated details
            _txn = await contract.getEscrowDetails(
                parseInt(_updatedEscrowId)
            );
            _receipt = await _txn.wait();
            _events = await _receipt.events?.filter((x) => x.event === 'EscrowDetails');
            _eventArgs = _events[0]?.args;


            setEscrowDetails({
                escrowId: _updatedEscrowId,
                client: _eventArgs?.client,
                worker: _eventArgs?.worker,
                amount: _eventArgs?.amount,
                isSettled: _eventArgs?.isSettled,
                isDisputed: _eventArgs?.isDisputed,
                agreement: _eventArgs?.agreement,
                submission: _eventArgs?.submission,
            });
            
        } catch (err) {
            console.error("Error while fetching escrow details: ", err);
        }
        setShowLoader(false);
    };

    const fetchWorkerEscrowIds = async () => {
        let _txn, _receipt, _events, _eventArgs;

        try {
            const _escrowIds = await contract.getWorkerEscrowIds();
            const _escrowID = _escrowIds[0];

            // get details
            _txn = await contract.getEscrowDetails(_escrowID);
            _receipt = await _txn.wait();
            _events = await _receipt.events?.filter((x) => x.event === 'EscrowDetails');
            _eventArgs = _events[0]?.args;

            setEscrowDetails({
                escrowId: _escrowID,
                worker: _eventArgs?.worker,
                amount: _eventArgs?.amount,
                isSettled: _eventArgs?.isSettled,
                isDisputed: _eventArgs?.isDisputed,
                agreement: _eventArgs?.agreement,
                submission: _eventArgs?.submission,
            });

        } catch (err) {
            console.error("Error while fetchClientEscrowIds: ", err);
        }
    };

    useEffect(() => {
        fetchWorkerEscrowIds();
    }, []);

    return (
        <Box display="flex" justifyContent="space-around" width="100%">
            {escrowDetails ? (
              <Box>
                <EscrowDetails details={escrowDetails} workerSubmit={(submittedData) => submitWorkData(submittedData)} />
              </Box>
            ) : null}

        </Box>
    );
};

export default Worker;
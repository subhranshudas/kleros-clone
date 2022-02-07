import React, { useState, useContext, useEffect } from 'react';
import { Web3Context } from '../context';
import { Box } from "@mui/material";
import { ethers } from 'ethers';

import CreateEscrow from '../components/CreateEscrow';
import EscrowDetails from '../components/EscrowDetails';

const Client = () => {
    const { contract, setShowLoader } = useContext(Web3Context);

    const [escrowDetails, setEscrowDetails] = useState(null);

    const createEscrowContractCall = async ({ 
        workerAddress,
        amount,
        agreement
    }) => {
        const contractAmount = ethers.utils.parseEther(amount);

        let _txn, _receipt, _events, _eventArgs;

        setShowLoader(true);

        try {
            _txn = await contract.createEscrow(workerAddress, contractAmount, agreement, { value: contractAmount });
            _receipt = await _txn.wait();
            _events = await _receipt.events?.filter((x) => x.event === 'EscrowCreated');
            _eventArgs = _events[0]?.args;

            const _escrowID = _eventArgs.escrowId;

            // get details
            _txn = await contract.getEscrowDetails(_eventArgs.escrowId);
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
            console.error("Error while creating escrow: ", err);
        }

        setShowLoader(false);
    };

    const fetchClientEscrowIds = async () => {
        let _txn, _receipt, _events, _eventArgs;

        setShowLoader(true);

        try {
            const _escrowIds = await contract.getClientEscrowIds();
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

        setShowLoader(false);
    };

    const clientSubmit = async (isApproved, id) => {
        let _txn, _receipt, _events, _eventArgs;
        const approvalEvent = isApproved ? 'WorkApproved' : 'WorkRejected';

        setShowLoader(true);

        try {
            _txn = await contract.approveWork(isApproved, id);
            _receipt = await _txn.wait();
            _events = await _receipt.events?.filter((x) => x.event === approvalEvent);
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
                isSettled: _eventArgs?.isSettled,
                isDisputed: _eventArgs?.isDisputed,
                agreement: _eventArgs?.agreement,
                submission: _eventArgs?.submission,
            });

        } catch (err) {
            console.error("Error while fetchClientEscrowIds: ", err);
        }

        setShowLoader(false);
    };

    useEffect(() => {
        fetchClientEscrowIds();
    }, []);

    return (
        <Box display="flex" flexDirection="column">
            {/* making it bit simpler for the POC */}
            {!escrowDetails ? <CreateEscrow onSubmit={createEscrowContractCall} /> : null}

            {escrowDetails ? (
              <Box>
                <EscrowDetails details={escrowDetails} clientSubmit={clientSubmit} isClient />
              </Box>
            ) : null}
        </Box>
    );
};

export default Client; 
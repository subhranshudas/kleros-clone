import React, { useState } from "react";
import AddIcon from "@mui/icons-material/Add";

import { makeStyles } from '@mui/styles';
import { Typography, Box, Fab, TextField } from "@mui/material";
import { isEmpty, trim } from "lodash";

import DialogBox from './Dialog';


const useStyles = makeStyles(() => ({
    root: {
      backgroundColor: "#9013fd !important",
      marginTop: "20px !important",
      marginLeft: "45px !important"
    }
  }));

export default function CreateEscrow({ onSubmit }) {
  const classes = useStyles();
  const [showNewEscrowForm, setShowNewEscrowForm] = useState(false);

  //  form states
  const [workerAddress, setWorkerAddress] = useState('');
  const [amount, setAmount] = useState(0);
  const [agreement, setAgreement] = useState('');

  const onChangeHandler = (e, field) => {
    const txt = e.target.value;

    if (field === 'workerAddress') {
      setWorkerAddress(txt);
    } else if (field === 'amount') {
      setAmount(txt);
    } else if (field === 'agreement') {
      setAgreement(txt);
    }
  };

  const onButtonClick = () => {
    setShowNewEscrowForm(!showNewEscrowForm);
  };

  const handleClose = () => {
    setShowNewEscrowForm(false);
  };

  const createEscrowHandler = () => {
    // some validations

    if (!(isEmpty(workerAddress) || isEmpty(amount) || isEmpty(agreement))) {
        onSubmit({
            workerAddress: trim(workerAddress),
            amount: trim(amount),
            agreement
        })
    } else {
      console.error("Please fill up all the fields!");
    }
  };

  return (
    <Box
      sx={{ backgroundColor: "#5a16b5", padding: "25px 75px 75px 75px", borderRadius: 1 }} 
      display="flex"
      flexDirection="column"
    >
      <Typography color="#fff" fontWeight="bold" fontSize="1.5rem" >Create Escrow</Typography>
      <Fab color="primary" aria-label="add" classes={{ root: classes.root }} onClick={onButtonClick}>
        <AddIcon />
      </Fab>


      <DialogBox
          id="new-escrow-modal"
          keepMounted
          open={showNewEscrowForm}
          onClose={handleClose}
          onSubmitHandler={createEscrowHandler}
          dialogHeader="Escrow Details"
          cancelBtnText="Cancel"
          submitBtnText="Create Escrow"
          dialogContent={() => {
            return (
              <Box padding={2} width="80%">
                <Box padding={2}>
                  <TextField
                    required
                    id="worker-address"
                    label="Worker Address"
                    sx={{ width: "100%" }}
                    value={workerAddress}
                    onChange={(e) => onChangeHandler(e, 'workerAddress')}
                  />
                </Box>

                <Box padding={2}>
                  <TextField
                    required
                    id="amount"
                    label="Amount (ETH)"
                    sx={{ width: "100%" }}
                    onChange={(e) => onChangeHandler(e, 'amount')}
                  />
                </Box>

                <Box padding={2}>
                  <TextField
                    required
                    id="agreement"
                    label="Agreement"
                    sx={{ width: "100%" }}
                    onChange={(e) => onChangeHandler(e, 'agreement')}
                  />
                </Box>
              </Box>
            );
          }}
      />
    </Box>
  );
}

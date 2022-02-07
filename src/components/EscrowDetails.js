import React, { useState } from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Button,
  Typography,
  TextField
} from "@mui/material";
import { ethers } from "ethers"; 

export default function EscrowDetails({
    details,
    isClient,
    clientSubmit,
    workerSubmit
}) {

  const ethAmount = ethers.utils.formatEther(details?.amount)?.toString() + " ETH";
  const completetionStatus = details?.submission?.length > 0;

  const [submissionData, setSubmissionData] = useState(completetionStatus ? details?.submission : '');

  const shouldDisableClientEscrowDetailsActions = () => {
    if (details?.clientDecisionGiven) { // client has already given decision
      return true;
    }

    if (details?.submission?.length < 1) { // worker is yet to submit
      return true;
    }

    if (details?.isDisputed) { // escrow is in dispute
      return true;
    }

    if (details?.isSettled) {
      return true;
    }

    return false;
  };

  const shouldDisableWorkerEscrowActions = () => {
    if (details?.clientDecisionGiven) { // client has already given decision
      return true;
    }

    if (details?.submission?.length > 0) { // worker already has a submission
      return true;
    }

    if (submissionData.length < 1) { // worker is yet to enter any value
      return true;
    }

    return false;
  }

  return (
    <Card sx={{ minWidth: 600 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          Escrow ID: {details?.escrowId.toString()}
        </Typography>
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" fontWeight="bold">{isClient ? "Worker" : "Client" }</Typography>
            <Typography display="flex">{isClient ? details?.worker : details?.client}</Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" fontWeight="bold">Amount:</Typography>
            <Typography display="flex">{ethAmount?.toString()}</Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" fontWeight="bold">Agreement:</Typography>
            <Typography display="flex">{details?.agreement}</Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" fontWeight="bold">Settlement Status:</Typography>
            <Typography display="flex">{details?.isSettled.toString()}</Typography>
          </Box>

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2" fontWeight="bold">Submission:</Typography>
            {isClient ? (
                <Typography display="flex">{details?.submission}</Typography>
            ) : (
                <TextField
                    required
                    id="submission"
                    label=""
                    sx={{ width:  "60%" }}
                    value={submissionData}
                    disabled={completetionStatus}
                    onChange={(e) => {
                        setSubmissionData(e.target.value);
                    }}
                />
            )}
          </Box>
        </Box>
      </CardContent>
      {isClient ? (
        <CardActions>
            <Button
              color="success"
              variant="contained"
              size="small"
              disabled={shouldDisableClientEscrowDetailsActions()}
              onClick={() => clientSubmit(true, details?.escrowId)}
            >
                Approve
            </Button>
            <Button
              color="error"
              variant="contained"
              size="small"
              disabled={shouldDisableClientEscrowDetailsActions()}
              onClick={() => clientSubmit(false, details?.escrowId)}
            >
                Reject
            </Button>
        </CardActions>
    ) : (
        <CardActions>
            <Button
                color="success"
                variant="contained"
                size="small"
                disabled={shouldDisableWorkerEscrowActions()}
                onClick={() => workerSubmit(submissionData)}
            >
                SUBMIT WORK
            </Button>
        </CardActions>
    )}
    </Card>
  );
}

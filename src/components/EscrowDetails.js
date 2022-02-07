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

  const workApprovalDone = completetionStatus && !details?.isDisputed;

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
            <Button color="success" variant="contained" size="small" disabled={!completetionStatus || workApprovalDone} onClick={() => clientSubmit(true, details?.escrowId)}>
                Approve
            </Button>
            <Button color="error" variant="contained" size="small" disabled={!completetionStatus || workApprovalDone} onClick={() => clientSubmit(false, details?.escrowId)}>
                Reject
            </Button>
        </CardActions>
    ) : (
        <CardActions>
            <Button
                color="success"
                variant="contained"
                size="small"
                disabled={details?.isSettled || completetionStatus || submissionData.length === 0}
                onClick={() => workerSubmit(submissionData)}
            >
                SUBMIT WORK
            </Button>
        </CardActions>
    )}
    </Card>
  );
}

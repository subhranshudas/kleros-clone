import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Dialog from "@mui/material/Dialog";

function DialogBox(props) {
    const {
        onClose,
        width,
        onSubmitHandler,
        dialogHeader,
        dialogContent,
        cancelBtnText,
        submitBtnText,
        open,
        ...other
    } = props; 

    const handleCancel = () => {
      onClose();
    };
  
    const handleOk = () => {
      onSubmitHandler();
      onClose();
    };
  
    return (
      <Dialog
        maxWidth="lg"
        sx={{ '& .MuiDialog-paper': { width: width || "60%" } }}
        open={open}
        {...other}
      >
        <DialogTitle>{dialogHeader}</DialogTitle>
        <DialogContent dividers>
          {dialogContent()}
        </DialogContent>
        <DialogActions>
          <Button color="secondary" variant="contained" autoFocus onClick={handleCancel}>
            {cancelBtnText}
          </Button>
          <Button color="primary" variant="contained" onClick={handleOk}>{submitBtnText}</Button>
        </DialogActions>
      </Dialog>
    );
  }

  export default DialogBox;
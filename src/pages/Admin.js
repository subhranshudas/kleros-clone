import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isEmpty } from 'lodash';
import { Web3Context } from '../context';
import appUtils from '../utils/common';

const Admin = () => {
    const { currentAccount, contract } = useContext(Web3Context);

    const navigate = useNavigate();

    useEffect(() => {
      async function adminCheck() {
        // when the contract and account is set
        if (!isEmpty(contract) && !isEmpty(currentAccount)) {
          const adminUser = await contract.escrowAdmin();
    
          if (adminUser.toLowerCase() !== appUtils.unWrapAddress(currentAccount)) {
            navigate('/');
          }
        }
      }
      adminCheck();

    }, [contract, currentAccount]);


    return (
        <div>
            <p>ADMIN connected?: {currentAccount}</p>
            <p>{contract?.address}</p>
        </div>
    );
};

export default Admin;
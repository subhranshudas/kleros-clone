import React, { useContext } from 'react';
import { Web3Context } from '../context';

const Worker = () => {
    const web3Context = useContext(Web3Context);

    return (
        <div>
            <p>Worker connected?: {web3Context.currentAccount}</p>
            <p>{web3Context.contract?.address}</p>
        </div>
    );
};

export default Worker;
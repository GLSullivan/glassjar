import React from 'react';
import TransactionList from './TransactionList';

import './../css/Pages.css'

const TransactionPage = () => {
  return (
    <div  className='glassjar__page glassjar__page--transactions'>
      <div className='glassjar__padding'>
        <h2>Transactions</h2>
        <TransactionList />
      </div>
    </div>
  );
};

export default TransactionPage;

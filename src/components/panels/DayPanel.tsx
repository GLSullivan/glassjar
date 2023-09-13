// import { useSelector, useDispatch }            from 'react-redux';
// import { setActiveTransaction }                from '../../redux/slices/transactions';
// import { openTransactionModal }                from '../../redux/slices/modals';
// import { getDateWithOrdinal }                  from '../../utils/utils'
// import TransactionListItem                     from '../TransactionListItem'
// import TransactionList                         from '../TransactionList';

import React                                      from 'react';
import { useSelector }                            from 'react-redux';

import {
  // getTransactionsByDate,
  accountBalanceOnDate
}                                                 from './../../redux/slices/projections';
import { selectAllAccounts }                      from './../../redux/slices/accounts';
import { RootState }                              from './../../redux/store';

import AccountListItem                            from './../AccountListItem';
import {   formatISO, addMonths, format }         from 'date-fns';

import './../../css/Panels.css';

export const DayPanel: React.FC = () => {
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);
  const graphRange = useSelector((state: RootState) => state.views.graphRange);
  const state      = useSelector((state: RootState) => state);
  const accounts   = useSelector(selectAllAccounts);

  const graphEnd   = formatISO(addMonths(new Date(activeDate), graphRange || 6));

  // const activeDateFormatted = new Date(activeDate).toISOString().split('T')[0];

  // const transactionsByDate = useSelector((state: RootState) =>
  //   getTransactionsByDate(state, activeDateFormatted)
  // );

  // const dispatch = useDispatch();

  return (
    <div className='glassjar__list'>

      {/*       
        <div className='glassjar__flex glassjar__flex--justify-between'>
          <h2>Transactions: </h2>
          <button
            onClick={() => {
              dispatch(setActiveTransaction(null));
              dispatch(openTransactionModal());
            }}
            className='glassjar__button glassjar__button--small' 
          >
            <i className='fa-solid fa-plus-minus' />
          </button>
        </div>
        {transactionsByDate.map((transaction) => (
          <TransactionListItem key={transaction.id} transaction={transaction} />
        ))} 
        <br />
        <TransactionList /> 
      */}

      <div className='glassjar__flex glassjar__flex--justify-between'>
        <h2>{graphRange} Month Projection:<br/>{format(new Date(graphEnd), 'MMMM do yyyy')}</h2>
      </div>

      <div className='account-balances'>
        {accounts.map((account) => (
          <AccountListItem key={account.id} account={account} balance={accountBalanceOnDate(state, account.id, graphEnd)}/>
        ))}
      </div>

    </div>
  );
};

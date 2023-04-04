import React                          from 'react';
import { useSelector, useDispatch }   from 'react-redux'
import { RootState }                  from './../redux/store';
import { openTransactionModal }       from './../redux/slices/modals'

export const TransactionList: React.FC = () => {

  const activeDate = useSelector((state: RootState) => state.activeDate.activeDate)
  const transactions = useSelector((state: RootState) => state.transactions.transactions)
  const dispatch = useDispatch();

  return (
    <div>
      <h3>Transactions {new Date(activeDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}</h3>
      {transactions.map((transaction) => (
        <h5 key={transaction.id}>{transaction.transactionName} | ${(transaction.amount).toFixed(2)} | {new Date(transaction.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}</h5>
      ))}
      <button onClick={() => dispatch(openTransactionModal())}>Add Transaction</button>
    </div>
  );
};

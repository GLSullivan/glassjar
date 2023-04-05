import React                          from 'react';
import { useSelector, useDispatch }   from 'react-redux';
import { RootState }                  from './../redux/store';
import { openTransactionModal }       from './../redux/slices/modals';
import { setActiveTransaction }       from './../redux/slices/transactions';
import { selectTransactionsByDate }   from './../redux/slices/projections';
import { localDateValue }             from './../utils/dateUtils'

export const TransactionList: React.FC = () => {
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);
  const activeDateFormatted = new Date(activeDate).toISOString().split("T")[0];
  const transactionsByDate = useSelector((state: RootState) => selectTransactionsByDate(state, activeDateFormatted));
  
  const dispatch = useDispatch();

  return (
    <div>
      <h3>
        Transactions{' '}
        {new Date(activeDate).toLocaleDateString('en-US', {
          month: 'short',
          day  : 'numeric',
          year : 'numeric',
        })}
      </h3>
      {transactionsByDate.map(transaction => (
        <h5
          onClick={() => {
            dispatch(setActiveTransaction(transaction));
            dispatch(openTransactionModal());
          }}
          key={transaction.id}
        >
          {transaction.transactionName} | ${(transaction.amount).toFixed(2)} | {localDateValue(transaction.date)} | {transaction.date}
        </h5>
      ))}
      <button
        onClick={() => {
          dispatch(setActiveTransaction(null));
          dispatch(openTransactionModal());
        }}
      >
        Add Transaction
      </button>
    </div>
  );
};

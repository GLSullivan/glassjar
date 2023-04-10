import React                          from 'react';
import { useSelector, useDispatch }   from 'react-redux';
import { RootState }                  from './../redux/store';
import { openTransactionModal }       from './../redux/slices/modals';
import { setActiveTransaction }       from './../redux/slices/transactions';
import { selectTransactionsByDate }   from './../redux/slices/projections';
import { localDateValue }             from './../utils/dateUtils'

import './../css/TransactionList.css'

export const TransactionList: React.FC = () => {
  const activeDate = useSelector(
    (state: RootState) => state.activeDates.activeDate
  );
  const activeDateFormatted = new Date(activeDate).toISOString().split("T")[0];
  const transactionsByDate = useSelector((state: RootState) =>
    selectTransactionsByDate(state, activeDateFormatted)
  );

  const dispatch = useDispatch();

  return (
    <div className="glassjar__transaction-list">
      <h3>
        {new Date(activeDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        })}
      </h3>
      {transactionsByDate.map((transaction) => (
        <h5
          onClick={() => {
            dispatch(setActiveTransaction(transaction));
            dispatch(openTransactionModal());
          }}
          key={transaction.id}
        >{transaction.type == 'deposit'    && <i className="fa-solid fa-plus" />}
         {transaction.type == 'withdrawal' && <i className="fa-solid fa-minus" />}
         {transaction.type == 'transfer'   && <i className="fa-regular fa-money-bill-transfer" />}
         {transaction.type == 'event'   && <i className="fa-regular fa-calendar" />}
         {" | "}
          {transaction.transactionName}{" | "}{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}{transaction.isRecurring && <> | <i className="fa-solid fa-repeat" /></>}
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

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch }   from 'react-redux';
import { RootState }                  from './../redux/store';
import { openTransactionModal }       from './../redux/slices/modals';
import { setActiveTransaction }       from './../redux/slices/transactions';
import { selectTransactionsByDate,
         calculateFutureBalances }    from './../redux/slices/projections';
import { localDateValue }             from './../utils/dateUtils'
import { Account }                    from "./../models/Account";
import { selectAllAccounts } from "./../redux/slices/accounts";

import "./../css/TransactionList.css";
const getUpdatedBalances = (
  transactionsByDate: ReturnType<typeof selectTransactionsByDate>,
  accounts: Account[],
  activeDate: string
) => {
  const { futureBalances, aggregateBalances } = calculateFutureBalances(
    transactionsByDate,
    accounts,
    1,
    activeDate
  );

  return { futureBalances, aggregateBalances };
};

export const TransactionList: React.FC = () => {
  const accounts = useSelector(selectAllAccounts);

  const activeDate = useSelector(
    (state: RootState) => state.activeDates.activeDate
  );

  const activeDateFormatted = new Date(activeDate).toISOString().split("T")[0];

  const transactionsByDate = useSelector((state: RootState) =>
    selectTransactionsByDate(state, activeDateFormatted)
  );

  const [balances, setBalances] = useState(() =>
    getUpdatedBalances(transactionsByDate, accounts, activeDateFormatted)
  );

  const dispatch = useDispatch();

  useEffect(() => {
    setBalances(
      getUpdatedBalances(transactionsByDate, accounts, activeDateFormatted)
    );
  }, [activeDateFormatted, transactionsByDate, accounts]);

  return (
    <div className="glassjar__transaction-list">
      <h3>
        {new Date(activeDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </h3>
      <h4>
        {accounts.map((account) => (
          <div key={account.id}>
            {account.name}:{" "}
            {balances.futureBalances[account.id][0].toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </div>
        ))}
        <div>
          Aggregate:{" "}
          {balances.aggregateBalances[0].toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </div>
      </h4>
      {transactionsByDate.map((transaction) => (
        <h5
          onClick={() => {
            dispatch(setActiveTransaction(transaction));
            dispatch(openTransactionModal());
          }}
          key={transaction.id}
        >
          {transaction.type == "deposit" && <i className="fa-solid fa-plus" />}
          {transaction.type == "withdrawal" && (
            <i className="fa-solid fa-minus" />
          )}
          {transaction.type == "transfer" && (
            <i className="fa-regular fa-money-bill-transfer" />
          )}
          {transaction.type == "event" && (
            <i className="fa-regular fa-calendar" />
          )}
          {" | "}
          {transaction.transactionName}
          {" | "}
          {transaction.amount.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
          {transaction.isRecurring && (
            <>
              {" "}
              | <i className="fa-solid fa-repeat" />
            </>
          )}
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

import React, { useState, useEffect, useMemo }    from "react";
import { useSelector, useDispatch }               from "react-redux";
import { RootState }                              from "./../redux/store";
import { showLoader, hideLoader }                 from './../redux/slices/loader';
import { openTransactionModal }                   from "./../redux/slices/modals";
import { setActiveTransaction }                   from "./../redux/slices/transactions";
import {
  selectTransactionsByDate,
  selectBalanceByDateAndAccount,
  getBalanceArrayForDateRange
}                                                 from "./../redux/slices/projections";
import { Account }                                from "./../models/Account";
import { selectAllAccounts }                      from "./../redux/slices/accounts";

import "./../css/TransactionList.css";

export const TransactionList: React.FC = () => {
  const state = useSelector((state: RootState) => state);

  const accounts = useSelector(selectAllAccounts);
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);
  const farDate = useSelector((state: RootState) => state.activeDates.farDate);

  const activeDateFormatted = new Date(activeDate).toISOString().split("T")[0];

  const transactionsByDate = useSelector((state: RootState) =>
    selectTransactionsByDate(state, activeDateFormatted)
  );

  const dispatch = useDispatch();

  const [balances, setBalances] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    const updateBalances = () => {
      const newBalances: { [id: string]: number } = {};
      accounts.forEach((account) => {
        newBalances[account.id] = selectBalanceByDateAndAccount(
          state,
          account
        );
      });

      setBalances(newBalances);
    };

    updateBalances();
  }, [state, activeDateFormatted, accounts]);

  return (
    <div className="glassjar__transaction-list">
      <h3>
        {new Date(activeDate).toLocaleDateString("en-US", {
          month: "short",
          day  : "numeric",
        })}
      </h3>
      <div className = "account-balances">
        <h4>Account Balances: </h4>
        {accounts.map((account) => (
          <p key = {account.id}>
            {account.name}: {" "}
            {balances[account.id]?.toLocaleString("en-US", {
              style   : "currency",
              currency: "USD",
            })}            
          </p>
        ))}
      </div>{" "}
      {transactionsByDate.map((transaction) => (
        <h5
          onClick={() => {
            dispatch(setActiveTransaction(transaction));
            dispatch(openTransactionModal());
          }}
          key = {transaction.id}
        >
          {transaction.type == "deposit" && <i className="fa-solid fa-plus" />}
          {transaction.type == "withdrawal" && (
            <i className = "fa-solid fa-minus" />
          )}
          {transaction.type == "transfer" && (
            <i className = "fa-regular fa-money-bill-transfer" />
          )}
          {transaction.type == "event" && (
            <i className = "fa-regular fa-calendar" />
          )}
          {" | "}
          {transaction.transactionName}
          {" | "}
          {transaction.amount.toLocaleString("en-US", {
            style   : "currency",
            currency: "USD",
          })}
          {transaction.isRecurring && (
            <>
              {" "}
              | <i className = "fa-solid fa-repeat" />
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

import React, { useState, useEffect, useMemo }    from "react";
import { useSelector, useDispatch }               from "react-redux";
import { RootState }                              from "./../redux/store";
import { showLoader, hideLoader }                 from './../redux/slices/loader';
import { openTransactionModal }                   from "./../redux/slices/modals";
import { setActiveTransaction }                   from "./../redux/slices/transactions";
import {
  selectTransactionsByDate,
  selectBalanceByDateAndAccount
}                                                 from "./../redux/slices/projections";
import { Account }                                from "./../models/Account";
import { selectAllAccounts }                      from "./../redux/slices/accounts";
import TransactionListItem from "./TransactionListItem"

import "./../css/TransactionList.css";

export const TransactionList: React.FC = () => {
  const state = useSelector((state: RootState) => state);

  const accounts = useSelector(selectAllAccounts);
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);

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
        ) as number; 
      });
  
      setBalances(newBalances);
    };
  
    updateBalances();
  }, [state, activeDateFormatted, accounts]);
  
console.log(selectBalanceByDateAndAccount(
  state,
  state.accounts.accounts[0],
  true,
  state.activeDates.today,
  state.activeDates.farDate
))


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
        <TransactionListItem transaction={transaction}/>
      ))}
      <br />
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

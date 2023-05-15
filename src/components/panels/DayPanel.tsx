import React, { useState }                        from "react";
import { useSelector, useDispatch }               from "react-redux";

import { setActiveTransaction }                   from "../../redux/slices/transactions";
import {
  getTransactionsByDate,
  accountBalanceOnDate
}                                                 from "../../redux/slices/projections";
import { selectAllAccounts }                      from "../../redux/slices/accounts";
import { openTransactionModal }                   from "../../redux/slices/modals";
import { RootState }                              from "../../redux/store";
// import { getDateWithOrdinal }                     from "../../utils/utils"

import TransactionListItem                        from "../TransactionListItem"
// import TransactionList                            from "../TransactionList";
import AccountListItem                            from "../AccountListItem";

import "./../../css/Panels.css";

export const DayPanel: React.FC = () => {
  const state      = useSelector((state: RootState) => state);
  const accounts   = useSelector(selectAllAccounts);
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);

  const activeDateFormatted = new Date(activeDate).toISOString().split("T")[0];

  const transactionsByDate = useSelector((state: RootState) =>
    getTransactionsByDate(state, activeDateFormatted)
  );

  const dispatch = useDispatch();

  return (
    <div className="glassjar__transaction-list">
      <div className="glassjar__flex glassjar__flex--justify-between">
        <h2>Account Balances: </h2>
      </div>
      <div className="account-balances">
        {accounts.map((account) => (
          <AccountListItem key={account.id} account={account} balance={accountBalanceOnDate(state,
            account.id,
            activeDate)}/>
        ))}
      </div>
      <div className="glassjar__flex glassjar__flex--justify-between">
        <h2>Transactions: </h2>
        <button
          onClick={() => {
            dispatch(setActiveTransaction(null));
            dispatch(openTransactionModal());
          }}
          className="button__new-transaction"
        >
          <i className="fa-solid fa-plus-minus" />
        </button>
      </div>
      {transactionsByDate.map((transaction) => (
        <TransactionListItem key={transaction.id} transaction={transaction} />
      ))}
      <br />
      {/* <TransactionList /> */}
    </div>
  );
};

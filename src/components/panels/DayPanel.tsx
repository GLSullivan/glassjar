import React                                      from "react";
import { useSelector, useDispatch }               from "react-redux";
import { RootState }                              from "../../redux/store";
import { openTransactionModal }                   from "../../redux/slices/modals";
import { setActiveTransaction }                   from "../../redux/slices/transactions";
import {
  getTransactionsByDate,
  accountBalanceOnDate
}                                                 from "../../redux/slices/projections";
import { getDateWithOrdinal }                     from "../../utils/utils"
import { selectAllAccounts }                      from "../../redux/slices/accounts";
import TransactionListItem                        from "../TransactionListItem"
import TransactionList                            from "../TransactionList";

import "./../../css/Panels.css";

export const DayPanel: React.FC = () => {
  const state = useSelector((state: RootState) => state);

  const accounts = useSelector(selectAllAccounts);
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);

  const activeDateFormatted = new Date(activeDate).toISOString().split("T")[0];

  const transactionsByDate = useSelector((state: RootState) =>
    getTransactionsByDate(state, activeDateFormatted)
  );

  const dispatch = useDispatch();

const dateWithOrdinal = getDateWithOrdinal(new Date(activeDate));
const { dateString, ordinal } = dateWithOrdinal;

  return (
    <div className="glassjar__transaction-list">
      <h1>
        <span>{dateString}</span>
        <sup style={{ fontSize: '0.8em', marginLeft: '2px' }}>{ordinal}</sup>
      </h1>
      <div className="glassjar__flex glassjar__flex--justify-between">
        <h2>Account Balances: </h2>
      </div>
      <div className="account-balances">
        {accounts.map((account) => (<div key={account.id}>
          <p key={account.id}>
            {account.name}: {" "}
            {accountBalanceOnDate(state,
          account.id,
          activeDate)?.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </p>
          
          </div>
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
      <TransactionList />
    </div>
  );
};

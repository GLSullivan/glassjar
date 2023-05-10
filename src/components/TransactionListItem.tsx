import { useDispatch }                from "react-redux";
import React                          from "react";

import { setActiveTransaction }       from "./../redux/slices/transactions";
import { openTransactionModal }       from "./../redux/slices/modals";

import { Transaction }                from "../models/Transaction";

import "./../css/Panels.css";

interface TransactionListItem {
  transaction           : Transaction;
}

const CalendarDay: React.FC<TransactionListItem> = React.memo(
  ({ transaction }) => {
    const dispatch = useDispatch();
    return (
      <div className="glassjar__transaction-list-item" onClick={() => { dispatch(setActiveTransaction(transaction)); dispatch(openTransactionModal()); }} key={transaction.id}        >
        {transaction.type === "deposit"     && <i className="fa-duotone fa-plus-circle" />}
        {transaction.type === "withdrawal"  && (<i className="fa-duotone fa-minus-circle" />)}
        {transaction.type === "transfer"    && (<i className="fa-duotone  fa-money-bill-transfer" />)}
        {transaction.type === "event"       && (<i className="fa-duotone fa-calendar" />)}
        <span>{transaction.transactionName}</span>
        {transaction.isRecurring && (<i className="fa-duotone fa-repeat" />)}
        <div>{(transaction.amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD", })}</div>
      </div>
    );
  }
);

export default CalendarDay;

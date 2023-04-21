import React                          from "react";
import { useDispatch }                from "react-redux";
import { openTransactionModal }       from "./../redux/slices/modals";
import { setActiveTransaction }       from "./../redux/slices/transactions";
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
        <div>
          {transaction.type == "deposit" && <i className="fa-duotone fa-plus-circle" />}
          {transaction.type == "withdrawal" && (<i className="fa-duotone fa-minus-circle" />)}
          {transaction.type == "transfer" && (<i className="fa-duotone  fa-money-bill-transfer" />)}
          {transaction.type == "event" && (<i className="fa-duotone fa-calendar" />)}
          <span>{transaction.transactionName}</span>
        </div>
        <div>
          {transaction.isRecurring && (<i className="fa-duotone fa-repeat" />)}
          <div>{transaction.amount.toLocaleString("en-US", { style: "currency", currency: "USD", })}</div>
        </div>
      </div>
    );
  }
);

export default CalendarDay;

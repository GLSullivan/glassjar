import { useDispatch, useSelector } from "react-redux";
import React                        from "react";

import { setActiveTransaction }     from "./../redux/slices/transactions";
import { openTransactionModal }     from "./../redux/slices/modals";

import { Transaction }              from "./../models/Transaction";
import { colorPalette }             from "./../data/ColorPalette";
import { RootState }                from "./../redux/store";

import "./../css/Panels.css";

interface TransactionListItem {
  transaction: Transaction;
}

const CalendarDay: React.FC<TransactionListItem> = React.memo(
  ({ transaction }) => {
    const dispatch = useDispatch();
    const accounts = useSelector((state: RootState) => state.accounts.accounts);

    let accountColor;
    let toAccountIndex = accounts.findIndex(account => account.id === transaction.toAccount);
    let fromAccountIndex = accounts.findIndex(account => account.id === transaction.fromAccount);
    
    if (transaction.type === "deposit" && toAccountIndex !== -1) {
      const toAccountColor = accounts[toAccountIndex].color;
      if (colorPalette[toAccountColor] !== undefined) {
        accountColor = colorPalette[toAccountColor];
      }
    } else if (fromAccountIndex !== -1) {
      const fromAccountColor = accounts[fromAccountIndex].color;
      if (colorPalette[fromAccountColor] !== undefined) {
        accountColor = colorPalette[fromAccountColor];
      }
    } 
    
    // If accountColor has not been set, use default
    if(accountColor === undefined) {
      accountColor = "#000";
    }

    return (
      <div className="glassjar__transaction-list-item" onClick={() => { dispatch(setActiveTransaction(transaction)); dispatch(openTransactionModal()); }} key={transaction.id}        >
        <div>
          <div className="glassjar__transaction-list-item__icon" style={{ color: accountColor }}>
            {transaction.type === "deposit" && (<i className="fa-duotone fa-fw fa-plus-circle" />)}
            {transaction.type === "withdrawal" && (<i className="fa-duotone fa-fw fa-minus-circle" />)}
            {transaction.type === "transfer" && (<i className="fa-duotone fa-fw fa-money-bill-transfer" />)}
            {transaction.type === "event" && (<i className="fa-duotone fa-fw fa-calendar" />)}
          </div>
          <span>{transaction.transactionName} {transaction.isRecurring && (<i className="glassjar__recurring-icon fa-duotone fa-repeat" />)}</span>
          {transaction.type !== "event" && <div>{(transaction.amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD", })}</div>}
        </div>
        {transaction.type !== "event" && <div className="glassjar__transaction-list-item__second-row">
          <div>
            {(transaction.type === "withdrawal" || transaction.type === "transfer") &&
              // <span>ERROR</span>
              <span>{accounts[accounts.findIndex(account => account.id === transaction.fromAccount)].name}</span>
            }
            {transaction.type === "transfer" && <i className="fa-light fa-angle-right" />}
            {(transaction.type === "deposit" || transaction.type === "transfer") &&
              // <span>ERROR</span>
              <span>{accounts[accounts.findIndex(account => account.id === transaction.toAccount)].name}</span>
            }</div>
          {(transaction.category && transaction.category !== "None") ? <span>{transaction.category}</span> : <span></span>}
        </div>}
      </div>
    );
  }
);

export default CalendarDay;

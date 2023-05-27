import { useDispatch, useSelector } from "react-redux";
import React                        from "react";

import { setActiveTransaction }     from "./../redux/slices/transactions";
import { openTransactionModal }     from "./../redux/slices/modals";

import { Transaction }              from "./../models/Transaction";
import { colorPalette }             from "./../data/ColorPalette";
import { RootState }                from "./../redux/store";

import "./../css/ListItems.css";

interface TransactionListItem {
  transaction: Transaction;
}

const transactionTypeIcons = {
  "deposit"   : "glassjar__list-icon fa-solid fa-fw fa-plus-circle",
  "withdrawal": "glassjar__list-icon fa-solid fa-fw fa-minus-circle",
  "transfer"  : "glassjar__list-icon fa-solid fa-fw fa-money-bill-transfer",
  "event"     : "glassjar__list-icon fa-solid fa-fw fa-fw fa-calendar"
};

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
    } else if (transaction.type === "transfer" && fromAccountIndex !== -1 && toAccountIndex !== -1) {
      const fromAccountColor = accounts[fromAccountIndex].color;
      const toAccountColor   = accounts[toAccountIndex].color;
      if (colorPalette[fromAccountColor] !== undefined) {
        accountColor = "linear-gradient(to right, " + colorPalette[fromAccountColor] + "," + colorPalette[fromAccountColor] + "," + colorPalette[toAccountColor] + "," + colorPalette[toAccountColor];
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
      <div className="glassjar__list-item" onClick={() => { dispatch(setActiveTransaction(transaction)); dispatch(openTransactionModal()); }} key={transaction.id}        >
        <div className="glassjar__list-item__icon">
          <i className={transactionTypeIcons[transaction.type]} />
          {!transaction.isRecurring && (<i style={{ color: accountColor }} className="glassjar__recurring-icon fa-solid fa-star" />)} 
          <div className="glassjar__list-icon__backing" style={{ background: accountColor }} />
        </div>
        <div className="glassjar__list-item__body">
          <div className="glassjar__list-item-row glassjar__list-item__row--row1">
            <h4>{transaction.transactionName}</h4>
            {transaction.type !== "event" && <h4>{(transaction.amount / 100).toLocaleString("en-US", { style: "currency", currency: "USD", })}</h4>}
          </div>
          {transaction.type !== "event" && <div className="glassjar__list-item-row glassjar__list-item__row--row2">
            <h5>
              {(transaction.type === "withdrawal" || transaction.type === "transfer") &&
                // <span>ERROR</span>
                <span>{accounts[accounts.findIndex(account => account.id === transaction.fromAccount)].name}</span>
              }
              {transaction.type === "transfer" && <> <i className="fa-solid fa-angle-right" /> </>}
              {(transaction.type === "deposit" || transaction.type === "transfer") &&
                // <span>ERROR</span>
                <span>{accounts[accounts.findIndex(account => account.id === transaction.toAccount)].name}</span>
              }</h5>
            {/* {(transaction.category && transaction.category !== "None") ? <span>{transaction.category}</span> : <span></span>} */}
          </div>}
        </div>
        <div className="glassjar__list-item__backing" style={{ background: accountColor }} />
      </div>
    );
  }
);

export default CalendarDay;

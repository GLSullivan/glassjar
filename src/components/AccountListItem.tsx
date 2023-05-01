import { useDispatch }                from "react-redux";
import React                          from "react";

import { setActiveAccount }           from '../redux/slices/accounts';
import { openAccountForm }            from '../redux/slices/modals';
import { Account }                    from "../models/Account";

import "./../css/Panels.css";

interface AccountListItem {
  account           : Account;
  balance          ?: number;
}

const accountTypeIcons = {
  "checking"     : "fa-light fa-money-check-dollar-pen",
  "savings"      : "fa-light fa-piggy-bank",
  "credit card"  : "fa-light fa-credit-card",
  "loan"         : "fa-light fa-hand-holding-dollar",
  "mortgage"     : "fa-light fa-house-chimney-window",
  "cash"         : "fa-light fa-wallet",
};

const CalendarDay: React.FC<AccountListItem> = React.memo(
  ({ account, balance }) => {
    const dispatch = useDispatch();
    return (
      <div
        className="glassjar__account-list-item"
        onClick={() => {
          dispatch(setActiveAccount(account));
          dispatch(openAccountForm());
        }}
        key={account.id}
      >
        <div>
          <i className={accountTypeIcons[account.type]} /> <span>{account.name}</span>
        </div>
        <div>
          {balance !== undefined && balance !== null
            ? (balance / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })
            : (account.currentBalance / 100).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
        </div>
      </div>
    );
  }
);

export default CalendarDay;

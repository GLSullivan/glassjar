import { useDispatch }                from "react-redux";
import React                          from "react";

import { setActiveAccount }           from '../redux/slices/accounts';
import { openAccountForm }            from '../redux/slices/modals';
import { Account }                    from "../models/Account";

import "./../css/Panels.css";

interface AccountListItem {
  account           : Account;
  balance          ?: String;
}

const CalendarDay: React.FC<AccountListItem> = React.memo(
  ({ account, balance }) => {
    const dispatch = useDispatch();
    return (
      <div className="glassjar__account-list-item" onClick={() => { dispatch(setActiveAccount(account)); dispatch(openAccountForm()); }} key={account.id}        >
        <div>
          {account.type === "checking" && <i className="fa-light fa-money-check-dollar-pen" />}
          {account.type === "savings" && <i className="fa-light fa-piggy-bank" />}
          {account.type === "credit card" && <i className="fa-light fa-credit-card" />}
          {account.type === "loan" && <i className="fa-light fa-hand-holding-dollar" />}
          {account.type === "mortgage" && <i className="fa-light fa-house-chimney-window" />}
          {account.type === "cash" && <i className="fa-light fa-wallet" />}
          <span>{" "}{account.name}</span>
        </div>
        <div>
          <div>{balance ? balance : account.currentBalance.toLocaleString("en-US", { style: "currency", currency: "USD", })}</div>
        </div>
      </div>
    );
  }
);

export default CalendarDay;

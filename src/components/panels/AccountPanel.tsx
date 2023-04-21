import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState }                from '../../redux/store';
import { openAccountForm }         from '../../redux/slices/modals';
import { setActiveAccount }         from '../../redux/slices/accounts';

import "./../../css/Panels.css";

export const AccountList: React.FC = () => {
  const accounts = useSelector((state: RootState) => state.accounts.accounts);
  const dispatch = useDispatch();

  return (
    <div className="glassjar__account-list">
      <h1>Accounts</h1>
      {accounts.map((account) => (
        <p
          onClick={() => {
            dispatch(setActiveAccount(account));
            dispatch(openAccountForm());
          }}
          key={account.id}
        >
          {account.name}: {account.currentBalance.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
        </p>
      ))}
      <button
        onClick={() => {
          dispatch(setActiveAccount(null));
          dispatch(openAccountForm());
        }}
      >
        Add Account
      </button>
    </div>
  );
};

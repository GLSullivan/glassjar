import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { setActiveAccount }         from '../../redux/slices/accounts';
import { openAccountForm }          from '../../redux/slices/modals';
import { RootState }                from '../../redux/store';

import AccountListItem              from '../AccountListItem';

import "./../../css/Panels.css";

export const AccountList: React.FC = () => {
  const accounts = useSelector((state: RootState) => state.accounts.accounts);
  const dispatch = useDispatch();

  return (
    <div className="glassjar__account-list">
      <h2>Accounts</h2>
      {accounts.map((account) => (
        <AccountListItem key={account.id} account={account} />
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

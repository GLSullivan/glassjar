import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState }                from './../redux/store';
import { openAccountForm }         from './../redux/slices/modals';
import { setActiveAccount }         from './../redux/slices/accounts';

// import './../css/AccountList.css';

export const AccountList: React.FC = () => {
  const accounts = useSelector((state: RootState) => state.accounts.accounts);
  const dispatch = useDispatch();

  return (
    <div className="glassjar__account-list">
      <h3>Accounts</h3>
      {accounts.map((account) => (
        <h5
          onClick={() => {
            dispatch(setActiveAccount(account));
            dispatch(openAccountForm());
          }}
          key={account.id}
        >
          {account.name} | {account.type} | ${account.currentBalance}
        </h5>
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

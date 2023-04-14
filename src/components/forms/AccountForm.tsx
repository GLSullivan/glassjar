import React, { useState }              from "react";
import { useSelector, useDispatch }     from "react-redux";
import { RootState }                    from './../../redux/store';
import { closeAccountForm }             from "./../../redux/slices/modals";
import {
    addAccount,
    updateAccount,
    setActiveAccount,
}                                       from "./../../redux/slices/accounts";
import { Account }                      from "./../../models/Account";
import CurrencyInput                    from 'react-currency-input-field';

export const AccountForm: React.FC = () => {
  const accounts = useSelector((state: RootState) => state.accounts.accounts);

  const activeAccount = useSelector(
    (state: RootState) => state.accounts.activeAccount
  );

  const [account, setAccount] = useState<Account>(
    activeAccount || {
      id            : "",
      name          : "",
      currentBalance: 0,
      type          : "checking",
      lastUpdated   : new Date().toISOString(),
    }
  );

  const dispatch = useDispatch();

  const generateUniqueId = () => {
    return new Date().getTime().toString();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  
    // Ensuring the account has the correct balance
    const updatedAccount = {
      ...account,
      currentBalance: parseFloat(account.currentBalance.toFixed(2)),
    };
  
    if (activeAccount) {
      dispatch(updateAccount(updatedAccount));
    } else {
      dispatch(addAccount({ ...updatedAccount, id: generateUniqueId() }));
    }
    dispatch(setActiveAccount(null));
    dispatch(closeAccountForm());
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setAccount({ ...account, [name]: value });
  };

  const handleCurrencyChange = (value: string | undefined, name?: string | undefined) => {
    if (name && value !== undefined) {
      setAccount({ ...account, [name]: parseFloat(value) });
    }
  };

  return (
    <div className="glassjar__form">
    <h2>
      {activeAccount
        ? `${account.name}`
        : "New Account"}
    </h2>
    
    {accounts.length < 1 && <h3>Let's setup your first account.</h3>}

    <form className="glassjar__account-form" onSubmit={handleSubmit}>
      <div className="glassjar__form__input-group">
        {" "}
        <label htmlFor="name">Name:</label>
        <input
          placeholder="Account Name:"
          type     = "text"
          id       = "name"
          name     = "name"
          value    = {account.name}
          onChange = {handleChange}
        />
      </div>

      <div className="glassjar__form__input-group">
        <label htmlFor="currentBalance">Current Balance:</label>
        <CurrencyInput
          id            = "currentBalance"
          prefix        = "$"
          name          = "currentBalance"
          placeholder   = "Current Balance:"
          defaultValue  = {account.currentBalance}
          decimalsLimit = {0}
          onValueChange = {handleCurrencyChange}
        />
      </div>

      <div className="glassjar__form__input-group glassjar__form__input-group--drop">
        <label htmlFor="type">Type:</label>
        <select
          id       = "type"
          name     = "type"
          value    = {account.type}
          onChange = {handleChange}
        >
          <option value = "checking">Checking</option>
          <option value = "savings">Savings</option>
          <option value = "credit card">Credit Card</option>
          <option value = "loan">Loan</option>
          <option value = "mortgage">Mortgage</option>
          <option value = "cash">Cash</option>
        </select>
      </div>
      {["loan", "mortgage", "credit card"].includes(account.type) && (
        <div className="glassjar__form__input-group">
          <label htmlFor="interestRate">Interest Rate:</label>
          <input
            type     = "number"
            id       = "interestRate"
            name     = "interestRate"
            value    = {account.interestRate || ""}
            onChange = {handleChange}
          />
        </div>
      )}
      <button type="submit">Save</button>
    </form>
    </div>
  );
};

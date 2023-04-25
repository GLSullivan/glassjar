import React, { useState }          from 'react';
import { useSelector, useDispatch } from 'react-redux';
import CurrencyInput                from 'react-currency-input-field';

import { RootState }                from './../../redux/store';
import { closeAccountForm }         from './../../redux/slices/modals';
import {
  addAccount,
  updateAccount,
  setActiveAccount,
  deleteAccount,
}                                   from './../../redux/slices/accounts';
import { Account }                  from './../../models/Account';
import ColorPicker                  from './../ColorPicker';

export const AccountForm: React.FC = () => {
  const dispatch = useDispatch();

  const accounts = useSelector((state: RootState) => state.accounts.accounts);

  const handleColorSelect = (color: string) => {
    setAccount({ ...account, color });
  };

  const handleDelete = () => {
    if (activeAccount) {
      dispatch(deleteAccount(account.id));
      dispatch(setActiveAccount(null));
      dispatch(closeAccountForm());
    }
  };

  const activeAccount = useSelector(
    (state: RootState) => state.accounts.activeAccount
  );

  const [account, setAccount] = useState<Account>(
    activeAccount || {
      id            : '',
      name          : '',
      currentBalance: 0,
      type          : 'checking',
      lastUpdated   : new Date().toISOString(),
      isLiability   : false,
      showInGraph   : true,
      color         : '',
    }
  );

  const generateUniqueId = () => {
    return new Date().getTime().toString();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  
    // Ensuring the account has the correct balance
    const updatedAccount = {
      ...account,
      currentBalance: parseFloat(account.currentBalance.toFixed(2)),
      color: account.color // Add this line to include the color information
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
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setAccount({ ...account, [target.name]: target.checked });
    } else {
      setAccount({ ...account, [target.name]: target.value });
    }
  };
  
  const handleCurrencyChange = (
    value : string | undefined,
    name ?: string | undefined
  ) => {
    if (name && value !== undefined) {
      setAccount({ ...account, [name]: parseFloat(value) });
    }
  };

  return (
    <div className = 'glassjar__form'>
      <h2>{activeAccount ? `${account.name}` : 'New Account'}</h2>

      {accounts.length < 1 && <h3>Let's setup your first account.</h3>}

      <form className = 'glassjar__account-form' onSubmit = {handleSubmit}>
      <div  className = 'glassjar__form__input-group'>
          {' '}
          <label htmlFor = 'name'>Name:</label>
          <input
            placeholder = 'Account Name:'
            type        = 'text'
            id          = 'name'
            name        = 'name'
            value       = {account.name}
            onChange    = {handleChange}
          />
        </div>

        <div   className = 'glassjar__form__input-group'>
        <label htmlFor   = 'currentBalance'>Current Balance:</label>
          <CurrencyInput
            id            = 'currentBalance'
            prefix        = '$'
            name          = 'currentBalance'
            placeholder   = 'Current Balance:'
            defaultValue  = {account.currentBalance}
            decimalsLimit = {0}
            onValueChange = {handleCurrencyChange}
          />
        </div>

        <div   className = 'glassjar__form__input-group glassjar__form__input-group--drop'>
        <label htmlFor   = 'type'>Type:</label>
          <select
            id       = 'type'
            name     = 'type'
            value    = {account.type}
            onChange = {handleChange}
          >
            <option value = 'checking'>Checking</option>
            <option value = 'savings'>Savings</option>
            <option value = 'credit card'>Credit Card</option>
            <option value = 'loan'>Loan</option>
            <option value = 'mortgage'>Mortgage</option>
            <option value = 'cash'>Cash</option>
          </select>
        </div>
        {['loan', 'savings', 'mortgage', 'credit card'].includes(
          account.type
        ) && (
          <div   className = 'glassjar__form__input-group'>
          <label htmlFor   = 'interestRate'>Interest Rate:</label>
            <input
              type     = 'number'
              id       = 'interestRate'
              name     = 'interestRate'
              value    = {account.interestRate || ''}
              onChange = {handleChange}
            />
          </div>
        )}
        <div className="glassjar__form__input-group glassjar__form__input-group--check">
          <label htmlFor="showInGraph">Show In Graph:</label>
          <input
            type="checkbox"
            id="showInGraph"
            name="showInGraph"
            checked={account.showInGraph}
            onChange={handleChange}
          />
        </div>
        <div className = 'glassjar__form__input-group'>
          <label>Select a color: </label>
          <ColorPicker onSelect={handleColorSelect} selectedColor={account.color} />
        </div>
        {account.type === 'loan' ||
        account.type === 'mortgage' ||
        account.type === 'credit card' ? (
          <div   className = 'glassjar__form__input-group'>
          <label htmlFor   = 'dueDate'>Due Date:</label>
            <input
              type     = 'date'
              id       = 'dueDate'
              name     = 'dueDate'
              value    = {account.dueDate || ''}
              onChange = {handleChange}
            />
          </div>
        ) : null}
        <div className="glassjar__flex glassjar__flex--justify-center">
          {activeAccount ? <button onClick={handleDelete}>Delete</button> : null}
          <button type = 'submit'>Save</button>
        </div>
      </form>
    </div>
  );
};

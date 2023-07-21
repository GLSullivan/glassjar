import CurrencyInput                from 'react-currency-input-field';
import { useSelector, useDispatch } from 'react-redux';
import React, { useState }          from 'react';

import { closeAccountForm }         from './../../redux/slices/modals';
import { RootState }                from './../../redux/store';
import {
  addAccount,
  updateAccount,
  setActiveAccount,
  deleteAccount,
}                                   from './../../redux/slices/accounts';
import { AccountType }              from './../../utils/constants';
import { Account }                  from './../../models/Account';
import ColorPicker                  from './../ColorPicker';
import PanelHeader                  from './../PanelHeader';

export const AccountForm: React.FC = () => {
  const dispatch = useDispatch();

  const accounts = useSelector((state: RootState) => state.accounts.accounts);

  const handleColorSelect = (selectedIndex: number) => {
    setAccount({ ...account, color: selectedIndex });
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

  const generateUniqueId = () => {
    return new Date().getTime().toString();
  };

  const [account, setAccount] = useState<Account>(
    activeAccount || {
      id            : generateUniqueId(),
      name          : '',
      currentBalance: 0,
      type          : AccountType.CHECKING,
      lastUpdated   : new Date().toISOString(),
      isLiability   : false,
      showInGraph   : true,
      color         : 0,
    }
  );

  const handleClose = () => {
    dispatch(setActiveAccount(null));
    dispatch(closeAccountForm())
  }

  const handleSave = () => {
    const updatedAccount = {
      ...account,
      currentBalance: parseFloat(account.currentBalance.toFixed(2)),
      color: account.color
    };
  
    if (activeAccount) {
      dispatch(updateAccount(updatedAccount));
    } else {
      dispatch(addAccount({ ...updatedAccount, id: generateUniqueId() }));
    }
    handleClose();
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSave()  
  };
  
  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
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
      setAccount({ ...account, [name]: (parseFloat(value) ? Math.round(parseFloat(value) * 100) : 0)  });
    }
  };

  return (
    <>
      <PanelHeader
        title={activeAccount ? `Update Account` : 'New Account'}
        onSecondaryAction={handleClose}
        secondaryActionLabel='Cancel'
        showSecondaryButton={accounts.length > 0}
        onPrimaryAction={handleSave}
        primaryActionLabel='Save'
      />

      <div className='glassjar__padding'>
        {/* <h2>{activeAccount ? `${account.name}` : 'New Account'}</h2> */}
        {accounts.length < 1 && <h3>Welcome, let's setup your first account.</h3>}

        <form className='glassjar__form' onSubmit={handleSubmit}>
          <div className='glassjar__form__input-group'>
            {' '}
            <input
              required
              placeholder='Account Name:'
              type='text'
              id='name'
              name='name'
              value={account.name}
              onChange={handleChange}
            />
            <label htmlFor='name'>Name:</label>
          </div>

          <div className='glassjar__form__input-group'>
            <CurrencyInput
              id='currentBalance'
              prefix='$'
              name='currentBalance'
              placeholder='Current Balance:'
              defaultValue={account.currentBalance / 100}
              decimalsLimit={0}
              onValueChange={handleCurrencyChange}
            />
            <label htmlFor='currentBalance'>Current Balance:</label>
          </div>

          <div className='glassjar__form__input-group glassjar__form__input-group--drop'>
            <label htmlFor='type'>Type:</label>
            <select
              id='type'
              name='type'
              value={account.type}
              onChange={handleChange}
            >
              <option value='checking'>Checking</option>
              <option value='savings'>Savings</option>
              <option value='credit card'>Credit Card</option>
              <option value='loan'>Loan</option>
              <option value='mortgage'>Mortgage</option>
              <option value='cash'>Cash</option>
            </select>
          </div>
          {['loan', 'savings', 'mortgage', 'credit card'].includes(
            account.type
          ) && (
            <div className='glassjar__form__input-group'>
              <input
                type='number'
                id='interestRate'
                name='interestRate'
                value={account.interestRate || ''}
                onChange={handleChange}
              />
              <label htmlFor='interestRate'>Interest Rate:</label>
            </div>
          )}
          <div className='glassjar__form__input-group'>
            <label>Account Color: </label>
            <ColorPicker
              onSelect={handleColorSelect}
              selectedIndex={account.color}
            />
          </div>
          {account.type === 'loan' ||
          account.type === 'mortgage' ||
          account.type === 'credit card' ? (
            <div className='glassjar__form__input-group'>
              <input
                type='date'
                id='dueDate'
                name='dueDate'
                value={account.dueDate || ''}
                onChange={handleChange}
              />
              <label htmlFor='dueDate'>Due Date:</label>
            </div>
          ) : null}
          <div className='glassjar__form__input-group glassjar__form__input-group--check'>
            <input
              type='checkbox'
              id='showInGraph'
              name='showInGraph'
              checked={account.showInGraph}
              onChange={handleChange}
            />
            <label htmlFor='showInGraph'>Show In Graph:</label>
          </div>
          {activeAccount && accounts.length > 1 && (
            <>
              <br />
              <div className='glassjar__flex glassjar__flex--justify-center'>
                <button
                  className='glassjar__text-button glassjar__text-button--warn'
                  onClick={handleDelete}
                >
                  Delete Account
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </>
  );
};

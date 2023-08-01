import CurrencyInput                      from 'react-currency-input-field';
import { useSelector, useDispatch }       from 'react-redux';
import React, { useEffect, useState }     from 'react';

import { closeAccountForm,
        openDeleteAccount }           from './../../redux/slices/modals';
import { RootState }                      from './../../redux/store';
import {      
  addAccount,     
  updateAccount,      
  setActiveAccount      
}                                         from './../../redux/slices/accounts';
import { AccountType }                    from './../../utils/constants';
import { Account }                        from './../../models/Account';
import ColorPicker                        from './../ColorPicker';
import PanelHeader                        from './../PanelHeader';

export const AccountForm: React.FC = () => {
  const dispatch = useDispatch();

  const accounts                    = useSelector((state: RootState) => state.accounts.accounts);

  const [saveReady,setSaveReady]    = useState<boolean>(false);

  const handleColorSelect = (selectedIndex: number) => {
    setAccount({ ...account, color: selectedIndex });
  };

  const handleDelete = () => {
    if (activeAccount) {

      dispatch(openDeleteAccount());

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
      creditLimit   : 0
    }
  );

  const [initialAccountData, setInitialAccountData] = useState(
    JSON.parse(JSON.stringify(account))
  );
  
  useEffect(() => { // Create initial copy for form dirt checking
    setInitialAccountData(JSON.parse(JSON.stringify(account)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    dispatch(setActiveAccount(null));
    dispatch(closeAccountForm())
  }

  const handleSave = () => {
    if (saveReady){
      const updatedAccount = {
        ...account,
        currentBalance: parseFloat(account.currentBalance.toFixed(2)),
        creditLimit: account.creditLimit ? parseFloat(account.creditLimit.toFixed(2)) : 0.00,
        color: account.color
      };
    
      if (activeAccount) {
        dispatch(updateAccount(updatedAccount));
      } else {
        dispatch(addAccount({ ...updatedAccount, id: generateUniqueId() }));
      }
      handleClose();
    }
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
      console.log("!")
    console.log(name,value,parseFloat(value))

      setAccount({ ...account, [name]: (parseFloat(value) ? Math.round(parseFloat(value) * 100) : 0 )  });
    } else if (name) {
      console.log("?")
      setAccount({ ...account, [name]: '' });
    }
  };

  // Validation (Formik was too complex for Yup and Formik)
  interface ErrorState {
    name: string | null;
    currentBalance: string | null;
  }

  const [errors, setErrors] = useState<ErrorState>({
    name: null,
    currentBalance: null,
  });

  useEffect(() => {
    if (!account) {
      return; 
    }

    let newErrors: ErrorState = {
      name: null,
      currentBalance: null,
    };

    if (
      typeof account.name !== 'string' ||
      !account.name ||
      account.name.trim() === ''
    ) {
      newErrors.name = 'Name is required.';
    }

    if (
      typeof account.currentBalance !== 'number' ||
      !Number.isInteger(account.currentBalance) 
    ) {
      newErrors.currentBalance = 'Amount required.';
    }

    const conditions = Object.values(newErrors).map((error) => error === null);
    const isSaveReady = conditions.every(Boolean);

    setErrors({ ...newErrors });

    if (
      JSON.stringify(account) !== JSON.stringify(initialAccountData) && isSaveReady
    ) {
      setSaveReady(true);
    } else {
      setSaveReady(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]); 
  
  return (
    <>
      <PanelHeader
        title                = {activeAccount ? `Update Account` : 'New Account'}
        onSecondaryAction    = {handleClose}
        secondaryActionLabel = 'Cancel'
        showSecondaryButton  = {accounts.length > 0}
        onPrimaryAction      = {handleSave}
        disablePrimaryButton = {!saveReady}
        primaryActionLabel   = 'Save'
      />

      <div className='glassjar__padding'>
        {/* <h2>{activeAccount ? `${account.name}` : 'New Account'}</h2> */}
        {accounts.length < 1 && (
          <h3>Welcome, let's setup your first account.</h3>
        )}

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
            <label htmlFor='name'>Name:{' '}
              <span className='glassjar__form__input-group__error'>
                {errors.name}
              </span>
            </label>
          </div>

          <div className='glassjar__flex glassjar__flex--tight'>

            <div className='glassjar__form__input-group'>
              <CurrencyInput
                id='currentBalance'
                prefix='$'
                name='currentBalance'
                placeholder='Balance:'
                defaultValue={account.currentBalance / 100}
                decimalsLimit={0}
                onValueChange={handleCurrencyChange}
              />
              <label htmlFor='currentBalance'>Current Balance:{' '}
                <span className='glassjar__form__input-group__error'>
                  {errors.currentBalance}
                </span>
              </label>
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

          </div>

          <div
            className={`glassjar__auto-height glassjar__auto-height--top ${['loan', 'savings', 'mortgage', 'credit card'].includes(
              account.type
            ) ? 'open' : ''
              }`}
          >
            <div className='glassjar__flex glassjar__flex--tight'>
              <div className='glassjar__form__input-group'>
                <input
                  type='number'
                  id='interestRate'
                  name='interestRate'
                  value={account.interestRate || '0'}
                  onChange={handleChange}
                />
                <label htmlFor='interestRate'>Interest Rate:</label>
              </div>

              {['credit card'].includes(account.type) && (
                <div className='glassjar__form__input-group'>
                  <CurrencyInput
                    id='creditLimit'
                    prefix='$'
                    name='creditLimit'
                    placeholder='Credit Limit:'
                    defaultValue={account.creditLimit ? account.creditLimit / 100 : 0}
                    decimalsLimit={0}
                    onValueChange={handleCurrencyChange}
                  />
                  <label htmlFor='creditLimit'>Credit Limit:</label>
                </div>
              )}
            </div>
          </div>

          <div className='glassjar__form__input-group'>
            <label>Account Color: </label>
            <ColorPicker
              onSelect={handleColorSelect}
              selectedIndex={account.color}
            />
          </div>

          <div
            className={`glassjar__auto-height glassjar__auto-height--top ${['loan', 'mortgage', 'credit card'].includes(
              account.type
            ) ? 'open' : ''
              }`}
          >
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
          </div>

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
                  type='button'
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

import CurrencyInput                  from 'react-currency-input-field';
import { useSelector, useDispatch }   from 'react-redux';
import React, { useEffect, useState } from 'react';

import {
  closeAccountForm,
  openDeleteAccount,
}                                     from './../../redux/slices/modals';
import { RootState }                  from './../../redux/store';
import {
  addAccount,
  updateAccount,
  setActiveAccount,
}                                     from './../../redux/slices/accounts';
import { AccountType }                from './../../utils/constants';
import { Account }                    from './../../models/Account';
import ColorPicker                    from './../ColorPicker';
import PanelHeader                    from './../PanelHeader';
import SVGGraph                       from './../SVGGraph';
import { getAccountMessages, 
  getTransactionsByAccount 
}                                     from './../../redux/slices/projections';
import MessagesList                   from './../MessageList';
import TransactionList                from './../TransactionList';

import './../../css/Panels.css';

export const AccountForm: React.FC = () => {
  const dispatch = useDispatch();

  const state    = useSelector((state: RootState) => state);
  const accounts = useSelector((state: RootState) => state.accounts.accounts);

  const [saveReady, setSaveReady]                     = useState<boolean>(false);
  const [editAccount, setEditAccount]                 = useState<boolean>(false);
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false);
  const [showAllMessages, setShowAllMessages]         = useState<boolean>(false);

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
      id                       : generateUniqueId(),
      name                     : '',
      currentBalance           : 0,
      type                     : AccountType.CHECKING,
      lastUpdated              : new Date().toISOString(),
      isLiability              : false,
      showInGraph              : true,
      color                    : 0,
      creditLimit              : 0,
      isSpendingPower          : true,
      notifyOnAccountStale     : true,
      notifyOnAccountOverDraft : true,
      notifyOnAccountOverCredit: true,
      notifyOnAccountPayoff    : true,
    }
  );

  const transactions = getTransactionsByAccount(state, account.id);

  const [initialAccountData, setInitialAccountData] = useState(
    JSON.parse(JSON.stringify(account))
  );

  useEffect(() => {
      // Create initial copy for form dirt checking
    setInitialAccountData(JSON.parse(JSON.stringify(account)));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    dispatch(setActiveAccount(null));
    dispatch(closeAccountForm());
  };

  const handleSave = () => {
    if (saveReady) {
      const updatedAccount = {
        ...account,
        lastUpdated   : new Date().toISOString(),
        currentBalance: parseFloat(account.currentBalance.toFixed(2)),
        creditLimit   : account.creditLimit
          ? parseFloat(account.creditLimit.toFixed(2))
            :  0.0,
        color: account.color,
      };

      if (activeAccount) {
        dispatch(updateAccount(updatedAccount));
      } else {
        dispatch(addAccount({ ...updatedAccount, id: generateUniqueId() }));
      }
      handleClose();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSave();
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
      setAccount({
        ...account,
        [name]: parseFloat(value) ? Math.round(parseFloat(value) * 100): 0,
      });
    } else if (name) {
      setAccount({ ...account, [name]: '' });
    }
  };

  interface ErrorState {
    name          : string | null;
    currentBalance: string | null;
  }

  const [errors, setErrors] = useState<ErrorState>({
    name          : null,
    currentBalance: null,
  });

  useEffect(() => {
    if (!account) {
      return;
    }

    let newErrors: ErrorState = {
      name          : null,
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

    const conditions  = Object.values(newErrors).map((error) => error === null);
    const isSaveReady = conditions.every(Boolean);

    setErrors({ ...newErrors });

    if (
      JSON.stringify(account) !== JSON.stringify(initialAccountData) &&
      isSaveReady
    ) {
      setSaveReady(true);
    } else {
      setSaveReady(false);
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const messages = getAccountMessages(state, account);

  return (
    <div className = "glassjar__panel glassjar__panel--account">
      <PanelHeader
        title                = {activeAccount ? activeAccount.name : 'New Account'}
        onSecondaryAction    = {handleClose}
        secondaryActionLabel = "Done"
        showSecondaryButton  = {accounts.length > 0}
        onPrimaryAction      = {handleSave}
        disablePrimaryButton = {!saveReady}
        primaryActionLabel   = "Save"
      />

      {accounts.length < 1 && <h3>Welcome, let's setup your first account.</h3>}

      <div  className = "glassjar__padding glassjar__padding--sides">
        <div className = "glassjar__flex glassjar__flex--justify-between glassjar__flex--align-baseline">
          <h3>Account</h3>
            <button
            onClick   = {() => setEditAccount(!editAccount)}
            className = "glassjar__text-button glassjar__text-button--smaller"
            type      = "button"
          >
            {editAccount ? <>Hide Settings</> : <>Show Settings</>}
          </button>
        </div>
        <form className = "glassjar__form" onSubmit = {handleSubmit}>
          <div  className = "glassjar__form__input-group">
            <CurrencyInput
              id            = "currentBalance"
              prefix        = "$"
              name          = "currentBalance"
              placeholder   = "Balance:"
              defaultValue  = {account.currentBalance / 100}
              decimalsLimit = {0}
              onValueChange = {handleCurrencyChange}
            />
            <label htmlFor = "currentBalance">
              Current Balance: {' '}
              <span className = "glassjar__form__input-group__error">
                {errors.currentBalance}
              </span>
            </label>
          </div>
          <div
            className={`glassjar__auto-height glassjar__auto-height--top ${
              editAccount || accounts.length < 1 ? 'open': ''
            }`}
          >
            <div>
              <div className = "glassjar__modal__subgroup glassjar__flex glassjar__flex--column glassjar__flex--tight">
              <div className = "glassjar__form__input-group">
                  {' '}
                  <input
                    required
                    placeholder = "Account Name:"
                    type        = "text"
                    id          = "name"
                    name        = "name"
                    value       = {account.name}
                    onChange    = {handleChange}
                  />
                  <label htmlFor = "name">
                    Name: {' '}
                    <span className = "glassjar__form__input-group__error">
                      {errors.name}
                    </span>
                  </label>
                </div>
                <div   className = "glassjar__form__input-group glassjar__form__input-group--drop">
                <label htmlFor   = "type">Type:</label>
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

                <div
                  className={`glassjar__auto-height glassjar__auto-height--top ${
                    ['loan', 'savings', 'mortgage', 'credit card'].includes(
                      account.type
                    )
                      ? 'open'
                      :  ''
                  }`}
                >
                  <div className = "glassjar__flex glassjar__flex--tight">
                  <div className = "glassjar__form__input-group">
                      <input
                        type     = "number"
                        id       = "interestRate"
                        name     = "interestRate"
                        value    = {account.interestRate || '0'}
                        onChange = {handleChange}
                      />
                      <label htmlFor = "interestRate">Interest Rate:</label>
                    </div>

                    {['credit card'].includes(account.type) && (
                      <div className = "glassjar__form__input-group">
                        <CurrencyInput
                          id           = "creditLimit"
                          prefix       = "$"
                          name         = "creditLimit"
                          placeholder  = "Credit Limit:"
                          defaultValue = {
                            account.creditLimit ? account.creditLimit / 100: 0
                          }
                          decimalsLimit = {0}
                          onValueChange = {handleCurrencyChange}
                        />
                        <label htmlFor = "creditLimit">Credit Limit:</label>
                      </div>
                    )}
                  </div>
                </div>

                <div className = "glassjar__form__input-group">
                  <label>Account Color: </label>
                  <ColorPicker
                    onSelect      = {handleColorSelect}
                    selectedIndex = {account.color}
                  />
                </div>

                <div
                  className={`glassjar__auto-height glassjar__auto-height--top ${
                    ['loan', 'mortgage', 'credit card'].includes(account.type)
                      ? 'open'
                      :  ''
                  }`}
                >
                  <div className = "glassjar__form__input-group">
                    <input
                      type     = "date"
                      id       = "dueDate"
                      name     = "dueDate"
                      value    = {account.dueDate || ''}
                      onChange = {handleChange}
                    />
                    <label htmlFor = "dueDate">Due Date:</label>
                  </div>
                </div>

                <div className = "glassjar__form__input-group glassjar__form__input-group--check">
                  <input
                    type     = "checkbox"
                    id       = "showInGraph"
                    name     = "showInGraph"
                    checked  = {account.showInGraph}
                    onChange = {handleChange}
                  />
                  <label htmlFor = "showInGraph">Show In Graph:</label>
                </div>

                {(account.type === 'checking' ||
                  account.type === 'savings' ||
                  account.type === 'credit card' ||
                  account.type === 'cash') && (
                  <div className = "glassjar__form__input-group glassjar__form__input-group--check">
                    <input
                      type     = "checkbox"
                      id       = "isSpendingPower"
                      name     = "isSpendingPower"
                      checked  = {account.isSpendingPower}
                      onChange = {handleChange}
                    />
                    <label htmlFor = "isSpendingPower">
                      Count As Spending Power: 
                    </label>
                  </div>
                )}

                <div className = "glassjar__form__input-group glassjar__form__input-group--check">
                  <input
                    type     = "checkbox"
                    id       = "notifyOnAccountStale"
                    name     = "notifyOnAccountStale"
                    checked  = {account.notifyOnAccountStale}
                    onChange = {handleChange}
                  />
                  <label htmlFor = "notifyOnAccountStale">
                    Notify When Account Is Stale: 
                  </label>
                </div>

                {(account.type === 'savings' ||
                  account.type === 'checking') && (
                  <div className = "glassjar__form__input-group glassjar__form__input-group--check">
                    <input
                      type     = "checkbox"
                      id       = "notifyOnAccountOverDraft"
                      name     = "notifyOnAccountOverDraft"
                      checked  = {account.notifyOnAccountOverDraft}
                      onChange = {handleChange}
                    />
                    <label htmlFor = "notifyOnAccountOverDraft">
                      Notify When Overdrawn: 
                    </label>
                  </div>
                )}

                {account.type === 'credit card' && (
                  <div className = "glassjar__form__input-group glassjar__form__input-group--check">
                    <input
                      type     = "checkbox"
                      id       = "notifyOnAccountOverCredit"
                      name     = "notifyOnAccountOverCredit"
                      checked  = {account.notifyOnAccountOverCredit}
                      onChange = {handleChange}
                    />
                    <label htmlFor = "notifyOnAccountOverCredit">
                      Notify When Limit Exceeded: 
                    </label>
                  </div>
                )}

                {(account.type === 'credit card' ||
                  account.type === 'loan' ||
                  account.type === 'mortgage') && (
                  <div className = "glassjar__form__input-group glassjar__form__input-group--check">
                    <input
                      type     = "checkbox"
                      id       = "notifyOnAccountPayoff"
                      name     = "notifyOnAccountPayoff"
                      checked  = {account.notifyOnAccountPayoff}
                      onChange = {handleChange}
                    />
                    <label htmlFor = "notifyOnAccountPayoff">
                      Notify on Payoff: 
                    </label>
                  </div>
                )}

                {activeAccount && accounts.length > 1 && (
                  <>
                    <br />
                    <div className = "glassjar__flex glassjar__flex--justify-center">
                      <button
                        className = "glassjar__text-button glassjar__text-button--smaller--warn"
                        type      = "button"
                        onClick   = {handleDelete}
                      >
                        Delete Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {accounts.length > 1 && (
        <div className = "glassjar__account-panel__graph">
          <SVGGraph
            accounts  = {[account]}
            hideZero  = {true}
            hideTrend = {true}
            hideDates = {true}
            hideRange = {true}
            hideToday = {true}
            hideMonth = {true}
            thickness = {2}
          />
        </div>
      )}

      {messages.length > 0 && (
        <div className = "glassjar__padding glassjar__padding--sides">
          <div className = "glassjar__flex glassjar__flex--justify-between glassjar__flex--align-baseline">
            <h3>Messages ({messages.length})</h3>
            {messages.length > 3 && (
              <button
                onClick   = {() => setShowAllMessages(!showAllMessages)}
                className = "glassjar__text-button glassjar__text-button--smaller"
                type      = "button"
              >
                {showAllMessages ? <>Hide</> : <>Show All</>}
              </button>
            )}
          </div>
          <div>
            <div className = "glassjar__modal__subgroup glassjar__modal__subgroup--no-padding">
              <MessagesList
                account         = {account}
                isSolo          = {true}
                isCollapsible   = {messages.length > 3}
                collapseControl = {showAllTransactions}
              ></MessagesList>
            </div>
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <div className = "glassjar__padding glassjar__padding--sides">
          <div className = "glassjar__flex glassjar__flex--justify-between glassjar__flex--align-baseline">
            <h3>Transactions ({transactions.length})</h3>
            {transactions.length > 3 && (
              <button
                onClick   = {() => setShowAllTransactions(!showAllTransactions)}
                className = "glassjar__text-button glassjar__text-button--smaller"
                type      = "button"
              >
                {showAllTransactions ? <>Hide</> : <>Show All</>}
              </button>
            )}
          </div>
          <div className = "glassjar__modal__subgroup">
            <TransactionList
              transactions    = {transactions}
              isCollapsible   = {transactions.length > 3}
              collapseControl = {showAllTransactions}
            />
          </div>
        </div>
      )}
    </div>
  );
};

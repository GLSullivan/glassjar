import { useDispatch, useSelector }                     from 'react-redux';
import React, { useState }                              from 'react';

import { bulkUpdateTransactions }                       from './../redux/slices/transactions';
import { deleteAccount, setActiveAccount }                             from './../redux/slices/accounts';
import { closeAccountForm, closeDeleteTransaction }     from './../redux/slices/modals';
import { hideLoader, showLoader}                        from './../redux/slices/loader';
import { Transaction }                                  from './../models/Transaction';
import { Account }                                      from './../models/Account';
import { RootState }                                    from './../redux/store';
import PanelHeader                                      from './PanelHeader';

import './../css/Loader.css'

const DeleteTransaction: React.FC = () => {
  const dispatch = useDispatch();

  const transactions                = useSelector((state: RootState) => state.transactions.transactions);
  const activeAccount               = useSelector((state: RootState) => state.accounts.activeAccount);
  const accounts                    = useSelector((state: RootState) => state.accounts.accounts);

  const [newAccount, setNewAccount] = useState<string>();

  if (activeAccount) {
    const associatedTransactions = transactions.filter(
      transaction =>  ((transaction.type === 'transfer')   && ((transaction.toAccount === activeAccount.id) || (transaction.fromAccount === activeAccount.id))) ||
                      ((transaction.type === 'deposit')    && (transaction.toAccount === activeAccount.id)) ||
                      ((transaction.type === 'withdrawal') && (transaction.fromAccount === activeAccount.id))
    );

    const otherAccounts = accounts.filter(
      accounts => accounts.id !== activeAccount.id
    );

    const deleteTheAccount = () => {
      dispatch(showLoader());

      let replacementAccount;

      if (!newAccount) {
        replacementAccount = otherAccounts[0].id
      } else {
        replacementAccount = newAccount
      }
      
      let updatedTransactions: Transaction[] = [];

      for (const transaction of associatedTransactions) {

        if (transaction.type === 'deposit') {
          if (transaction.toAccount === activeAccount.id) {
            // Only 'toAccount' field is updated if it matches the active account
            const updatedTransaction = {
              ...transaction,
              toAccount: replacementAccount,
              fromAccount: ''
            };
            updatedTransactions.push(updatedTransaction);
          }
        }

        if (transaction.type === 'withdrawal') {
          if (transaction.fromAccount === activeAccount.id) {
            const updatedTransaction = {
              ...transaction,
              fromAccount: replacementAccount,
              toAccount: ''
            };
            updatedTransactions.push(updatedTransaction);
          }
        }

        if (transaction.type === 'transfer') {
          if (transaction.toAccount === activeAccount.id) {
            // Only 'toAccount' field is updated if it matches the active account
            const updatedTransaction = {
              ...transaction,
              toAccount: replacementAccount
            };
            updatedTransactions.push(updatedTransaction);
          } 
          if (transaction.fromAccount === activeAccount.id) {
            const updatedTransaction = {
              ...transaction,
              fromAccount: replacementAccount
            };
            updatedTransactions.push(updatedTransaction);
          }
        }

      }

      dispatch(bulkUpdateTransactions(updatedTransactions));

      dispatch(deleteAccount(activeAccount))

      dispatch(setActiveAccount(null));
      dispatch(closeAccountForm());
      dispatch(closeDeleteTransaction());
      dispatch(hideLoader());

    }

    return (
      <>
        <PanelHeader
          title                = {activeAccount.name || 'Delete Account'}
          onSecondaryAction    = {() => dispatch(closeDeleteTransaction())}
          secondaryActionLabel = 'Cancel'
          showPrimaryButton    = {false}
        />
        <div className='glassjar__padding'>
          <div className='glassjar__flex glassjar__flex--column glassjar__flex--tight'>
            <p className='glassjar__no-margin'>There are {associatedTransactions.length} transaction{associatedTransactions.length !== 1 ? 's' : ''} associated with this account. To which account should they be moved?</p>
            <div className='glassjar__form__input-group glassjar__form__input-group--drop'>
              <label htmlFor='fromAccount'>New Account:</label>
              <select
                id='fromAccount'
                onChange={(e) => {
                  setNewAccount(e.target.value);
                }}
              >
                {otherAccounts.map((account: Account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='glassjar__flex glassjar__flex--justify-center'>
              <button onClick={deleteTheAccount}>Delete</button>
            </div>
          </div>
        </div>

      </>
    );
  } else {
    return null;
  }
};

export default DeleteTransaction;

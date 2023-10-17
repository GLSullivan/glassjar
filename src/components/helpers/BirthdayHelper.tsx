import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import CurrencyInput from 'react-currency-input-field';

import BirthdayTransactionForm from '../forms/BirthdayTransactionForm';
import { Transaction } from './../../models/Transaction';
import { RootState } from './../../redux/store';
import { Account } from '../../models/Account';

interface Form {
  key                     ?: number;
  initialCategory         ?: string;
  initialName             ?: string;
  initialArbitraryDates   ?: string[] | undefined;
  isActive                ?: boolean;
  initialActiveTransaction?: Transaction | null;
}

const BirthdayHelper: React.FC = () => {
  const accounts                      = useSelector((state: RootState) => state.accounts.accounts);

  const [forms, setForms]             = useState<Form[]>([]);
  const [amount, setAmount]           = useState(1000);
  const [fromAccount, setFromAccount] = useState(accounts[0].id);

  const today = new Date();

  const [initialForm, setInitialForm] = useState<Form>({
      key                     : Date.now(),
      initialCategory         : 'Charity and Gifts',
      initialName             : '',
      isActive                : false,
      initialActiveTransaction: null
  });

  const allTransactions = useSelector(
    (state: RootState) => state.transactions.transactions
  );

  useEffect(() => {
    const newTransactions = allTransactions.filter(
      (transaction) => transaction.fromHelper === 'birthday'
    );
  
    const newForms = newTransactions.map((transaction, index) => ({
      key                     : Number(transaction.event_id + '' + index), 
      initialCategory         : transaction.category,
      initialName             : transaction.transactionName,
      initialArbitraryDates   : transaction.arbitraryDates,
      isActive                : true,
      initialActiveTransaction: transaction
    }));
  
    setForms(newForms);
  }, [allTransactions]);
  
  
  const handleFormSubmit = (formData: Transaction) => {
    setForms((prevForms) => [
      ...prevForms,
      {
        key: Date.now(),
        ...formData,
        isActive: true,
      },
    ]);
  
    // Resets the initialForm state
    setInitialForm({
      key: Date.now(),
      initialCategory: 'Charity and Gifts',
      isActive: false,
    });
  };
  
  return (
    <>
     <div className='glassjar__form__input-group'>
              <label htmlFor='amount'>Amount:</label>
              <CurrencyInput
                id='amount'
                prefix='$'
                name='amount'
                placeholder='Transaction Amount:'
                defaultValue={amount / 100} // Convert cents to dollars for display
                decimalsLimit={2} // Allow decimal input
                onValueChange={(value) =>
                  setAmount(value ? Math.round(parseFloat(value) * 100) : 0)
                }
              />
            </div>
            <div className='glassjar__form__input-group glassjar__form__input-group--drop'>
            <label htmlFor='fromAccount'>From Account:</label>
            <select
              id='fromAccount'
              value={fromAccount}
              onChange={(e) => {
                setFromAccount(e.target.value);
              }}
            >
              {accounts.map((account: Account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
      <BirthdayTransactionForm
        key                      = {initialForm.key}
        initialCategory          = {initialForm.initialCategory}
        isActive                 = {initialForm.isActive}
        initialActiveTransaction = {initialForm.initialActiveTransaction}
        initialFromHelper        = 'birthday'
        onSubmit                 = {handleFormSubmit}
        initialAmount            = {amount}
        initialFromAccount       = {fromAccount}
        initialDate              = { today.toISOString()}
              />
      {forms.map((form, index) => (
        <BirthdayTransactionForm
          key                      = {form.key || index} // Using index as a fallback
          initialCategory          = {form.initialCategory}
          isActive                 = {form.isActive}
          initialActiveTransaction = {form.initialActiveTransaction}
          initialFromHelper        = 'birthday'
        />
      ))}
    </>
  );
};

export default BirthdayHelper;

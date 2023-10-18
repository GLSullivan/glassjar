import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CurrencyInput from 'react-currency-input-field';

import { addTransaction, updateTransaction } from '../../redux/slices/transactions';
import { RootState } from '../../redux/store';
import { Transaction } from '../../models/Transaction';
import { CustomIntervalType, RecurrenceFrequency, TransactionType } from './../../utils/constants';

import './../../css/MiniForms.css';

interface HolidayTransactionFormProps {
  initialName                ?: string;
  initialAmount              ?: number;
  initialDay                 ?: string;
  initialDate                ?: string;
  initialType                ?: TransactionType;
  initialDescription         ?: string;
  initialFromAccount         ?: string;
  initialToAccount           ?: string;
  initialIsRecurring         ?: boolean;
  initialEndDate             ?: string;
  initialRecurrenceFrequency ?: RecurrenceFrequency;
  initialAllowOverpayment    ?: boolean;
  initialShowInCalendar      ?: boolean;
  initialCategory            ?: string;
  initialArbitraryDates      ?: string[];
  isActive                   ?: boolean;
  initialActiveTransaction   ?: Transaction;
  initialFromHelper          ?: string;
}

const HolidayTransactionForm: React.FC<HolidayTransactionFormProps> = ({
  initialName           = '',
  initialAmount         = 0,
  initialCategory       = 'Charity and Gifts',
  initialArbitraryDates = [],
  isActive              = false,
  initialActiveTransaction,
  initialDate,
  initialRecurrenceFrequency,
  initialFromHelper
}) => {
  const accounts                = useSelector((state: RootState) => state.accounts.accounts);

  if (!initialDate && initialArbitraryDates.length > 0) {
    initialDate = initialArbitraryDates[0]; 
  }

  const activeTransaction = initialActiveTransaction;

  const dispatch = useDispatch();

  if (initialArbitraryDates.length > 1) {
    initialRecurrenceFrequency = RecurrenceFrequency.ARBITRARY
  } else {
    initialRecurrenceFrequency = RecurrenceFrequency.YEARLY
  }
  
    const [amount, setAmount]                                   = useState(activeTransaction?.amount || initialAmount);

    const transactionName     = activeTransaction?.transactionName || initialName;
    const date                = activeTransaction?.date ? new Date(activeTransaction.date).toISOString() :
                                    initialDate                  ? new Date(initialDate).toISOString()                 : 
                                    initialArbitraryDates.length > 0 ? new Date(initialArbitraryDates[0]).toISOString(): 
                                    '';
    const type                = activeTransaction?.type || TransactionType.WITHDRAWAL;
    const fromAccount         = activeTransaction?.fromAccount || accounts[0].id;
    const toAccount           = activeTransaction?.toAccount || accounts[0].id;
    const description         = activeTransaction?.description || '';
    const isRecurring         = activeTransaction?.isRecurring || true;
    const endDate             = activeTransaction?.endDate || '';
    let   recurrenceFrequency = activeTransaction?.recurrenceFrequency || initialRecurrenceFrequency;
    const customIntervalType  = activeTransaction?.customIntervalType || CustomIntervalType.WEEK;
    let   arbitraryDates      = activeTransaction?.arbitraryDates || initialArbitraryDates;
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
    
      if (arbitraryDates.length > 1) {
        recurrenceFrequency = RecurrenceFrequency.ARBITRARY;
      } else {
        arbitraryDates = [];
      }
      
      // setArbitraryDates(prevDates => {
        let newArbitraryDates = arbitraryDates;
        if (arbitraryDates.length > 1) {
          newArbitraryDates = arbitraryDates.slice(1);
        }
    
        const isoDate = new Date(date).toISOString();
    
        const transactionData: Transaction = {
          transactionName,
          type,
          amount,
          description,
          isRecurring,
          recurrenceFrequency,
          customIntervalType,
          date          : isoDate,
          fromAccount   : fromAccount,
          toAccount     : toAccount,
          event_id      : activeTransaction ? activeTransaction.event_id: new Date().toISOString(),
          endDate       : endDate,
          showInCalendar: true,
          category      : initialCategory,
          arbitraryDates: newArbitraryDates,
          fromHelper    : initialFromHelper,
          rrule         : ''
        };
    
        if (activeTransaction) {
          dispatch(updateTransaction(transactionData));
        } else {
          dispatch(addTransaction(transactionData));
        }
    
      };

  return (
    <form  className={`glassjar__mini-transaction ${isActive ? 'active' : ''}`} onSubmit={handleSubmit}>
      <div className='glassjar__form__input-group'>
        <h3>{transactionName}</h3>
      </div>

      <div className='glassjar__mini-transaction__sub'>
        <div className='glassjar__form__input-group'>
          <label htmlFor='amount'>Amount:</label>
          <CurrencyInput
            prefix        = '$'
            id            = 'amount'
            name          = 'amount'
            placeholder   = 'Amount'
            defaultValue  = {amount / 100}
            decimalsLimit = {2}
            onValueChange = {(value) =>
              setAmount(value ? Math.round(parseFloat(value) * 100) : 0)
            }
          />
        </div>

        <button type='submit'>
          {initialActiveTransaction ? <i className='fa-solid fa-floppy-disk' /> : <i className='fa-solid fa-plus' /> }
        </button>
      </div>
    </form>
  );
};

export default HolidayTransactionForm;

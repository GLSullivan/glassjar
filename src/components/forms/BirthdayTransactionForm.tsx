import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CurrencyInput from 'react-currency-input-field';

import { addTransaction, updateTransaction, } from '../../redux/slices/transactions';
import { RootState } from '../../redux/store';
import { Transaction } from '../../models/Transaction';
import { CustomIntervalType, RecurrenceFrequency, TransactionType } from '../../utils/constants';
import { addZoneOffset, stripTime } from '../../utils/dateUtils';

import './../../css/MiniForms.css';

interface BirthdayTransactionFormProps {
  key                        ?: number;
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
  initialActiveTransaction   ?: Transaction | null | undefined;
  initialFromHelper          ?: string;
  onSubmit                   ?: (formData: Transaction) => void;
}

const HolidayTransactionForm: React.FC<BirthdayTransactionFormProps> = ({
  key,
  initialName           = '',
  initialAmount         = 0,
  initialCategory       = 'Charity and Gifts',
  isActive              = false,
  initialActiveTransaction,
  initialDate,
  initialFromAccount,
  initialRecurrenceFrequency = RecurrenceFrequency.YEARLY,
  initialFromHelper,
  onSubmit,
}) => {
  const accounts          = useSelector((state: RootState) => state.accounts.accounts);
  const activeTransaction = initialActiveTransaction;
  const dispatch          = useDispatch();

  const [transactionName, setTransactionName] = useState(
    activeTransaction?.transactionName || initialName
  );

  const [date, setDate] = useState(() => {
    if (activeTransaction?.date) {
      return new Date(activeTransaction.date).toISOString();
    }
    if (initialDate) {
      return new Date(initialDate).toISOString();
    }
    return '';
  });

  const [amount, setAmount] = useState(
    activeTransaction?.amount || initialAmount
  );

  const type        = activeTransaction?.type || TransactionType.WITHDRAWAL;
  const category    = activeTransaction?.category || initialCategory;
  const fromAccount = activeTransaction?.fromAccount || initialFromAccount || accounts[0].id;
  const toAccount   = activeTransaction?.toAccount || accounts[0].id;
  const description = activeTransaction?.description || '';
  const isRecurring = activeTransaction?.isRecurring || true;
  const endDate     = activeTransaction?.endDate || '';

  let   recurrenceFrequency = activeTransaction?.recurrenceFrequency || initialRecurrenceFrequency;
  const customIntervalType  = activeTransaction?.customIntervalType || CustomIntervalType.WEEK;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isoDate = new Date(date).toISOString();

    const transactionData: Transaction = {
      transactionName,
      type,
      amount,
      description,
      isRecurring,
      recurrenceFrequency,
      customIntervalType,
      endDate           : endDate,
      date              : isoDate,
      allowOverpayment  : false,
      showInCalendar    : true,
      fromAccount       : fromAccount,
      toAccount         : toAccount,
      id                : activeTransaction ? activeTransaction.id: new Date().getTime(),
      category          : category,
      fromHelper        : initialFromHelper,
    };

    if (activeTransaction) {
      dispatch(updateTransaction(transactionData));
    } else {
      dispatch(addTransaction(transactionData));
    }

    if (onSubmit) {
      onSubmit(transactionData);
    }

  };

  return (
    <form
      className={`glassjar__mini-transaction ${isActive ? 'active' : ''}`}
      onSubmit={handleSubmit}
    >
      <div className='glassjar__form__input-group'>
        {/* <label htmlFor='Name'>Transaction Name:</label> */}
        <input
          placeholder = 'Name'
          type        = 'text'
          value       = {transactionName}
          onChange    = {(e) => setTransactionName(e.target.value)}
        />
      </div>

      <div className='glassjar__mini-transaction__sub'>
        <div className='glassjar__form__input-group glassjar__form__input-group--date'>
          <label htmlFor='date'>Date:</label>
          <input
            type     = 'date'
            id       = 'date'
            value    = {stripTime(date)}
            onChange = {(e) => setDate(addZoneOffset(e.target.value))}
          />
        </div>

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
          {initialActiveTransaction ? (
            <i className='fa-solid fa-floppy-disk' />
          ) : (
            <i className='fa-solid fa-plus' />
          )}
        </button>

      </div>
    </form>
  );
};

export default HolidayTransactionForm;

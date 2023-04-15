import React, { useEffect, useState }                             from 'react';
import { useDispatch, useSelector }                               from 'react-redux';
import CurrencyInput                                              from 'react-currency-input-field';

import { Transaction }                                            from './../../models/Transaction';
import { addTransaction, updateTransaction, deleteTransaction }   from './../../redux/slices/transactions';
import { RootState }                                              from './../../redux/store';
import { stripTime, addZoneOffset }                               from './../../utils/dateUtils';
import { Account }                                                from './../../models/Account';
import { resetMemoizedBalance }                                   from './../../redux/slices/projections';

import './../../css/Forms.css';
interface TransactionFormProps {
  onClose: () => void;
  initialDate?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, initialDate }) => {
  const activeTransaction = useSelector((state: RootState) => state.transactions.activeTransaction);
  const accounts          = useSelector((state: RootState) => state.accounts.accounts);

  const [transactionName, setTransactionName] = useState(activeTransaction?.transactionName || '');
  const [date, setDate] = useState(() => {
    if (activeTransaction?.date) {
      return new Date(activeTransaction.date).toISOString();
    }
    if (initialDate) {
      return new Date(initialDate).toISOString();
    }
    return '';
  });
  const [type, setType]                               = useState(activeTransaction?.type || 'withdrawal');
  const [amount, setAmount]                           = useState(activeTransaction?.amount || 0);
  const [fromAccount, setFromAccount]                 = useState(activeTransaction?.fromAccount || '');
  const [toAccount, setToAccount]                     = useState(activeTransaction?.toAccount || '');
  const [description, setDescription]                 = useState(activeTransaction?.description || '');
  const [isRecurring, setIsRecurring]                 = useState(activeTransaction?.isRecurring || false);
  const [endDate, setEndDate]                         = useState(activeTransaction?.endDate || '');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(activeTransaction?.recurrenceFrequency || 'daily');

  const dispatch = useDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const localDate = new Date(date);
    const isoDate = localDate.toISOString();

    const localEndDate = endDate ? new Date(endDate) : undefined;
    const isoEndDate = localEndDate ? localEndDate.toISOString() : undefined;

    const transactionData: Transaction = {
      transactionName,
      date: isoDate,
      type,
      amount,
      description,
      fromAccount,
      toAccount,
      id: activeTransaction ? activeTransaction.id : new Date().getTime(),
      isRecurring,
      endDate: isoEndDate,
      recurrenceFrequency,
      allowOverpayment: false,
      showInCalendar: true
    };

    if (activeTransaction) {
      dispatch(updateTransaction(transactionData));

      if (type === "withdrawal" || type === "transfer") {
        resetMemoizedBalance(fromAccount);
      }
      if (type === "deposit" || type === "transfer") {
        resetMemoizedBalance(toAccount);
      }

    } else {
      dispatch(addTransaction(transactionData));
    }

    onClose();
  };

  useEffect(() => {
    if (!activeTransaction && accounts.length > 0) {
      setFromAccount(accounts[0].id);
      setToAccount(accounts[0].id);
    }
  }, [activeTransaction, accounts]);

  return (
    <div className="glassjar__form">
      <h2>
        {activeTransaction
          ? `${activeTransaction.transactionName}`
          : "New Transaction"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="glassjar__form__input-group">
          <label htmlFor="name">Transaction Name:</label>
          <input
            placeholder='Transaction Name'
            type="text"
            id="transactionName"
            value={transactionName}
            onChange={(e) => setTransactionName(e.target.value)}
          />
        </div>

        <div className="glassjar__form__input-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={stripTime(date)}
            onChange={(e) => setDate(addZoneOffset(e.target.value))}
          />
        </div>

        <div className='glassjar__flex'> 
          <div className="glassjar__form__input-group glassjar__form__input-group--drop">
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as
                    | "deposit"
                    | "withdrawal"
                    | "transfer"
                    | "event"
                )
              }
            >
              <option value = "deposit">Income</option>
              <option value = "withdrawal">Expense</option>
              <option value = "transfer">Transfer</option>
              <option value = "event">Event</option>
            </select>
          </div>

          <div className="glassjar__form__input-group">
            <label htmlFor="amount">Amount:</label>
            <CurrencyInput
              id            = "amount"
              prefix        = "$"
              name          = "amount"
              placeholder   = "Transaction Amount:"
              defaultValue  = {amount}
              decimalsLimit = {0}
              onValueChange = {(value) => setAmount(value ? parseInt(value) : 0)}
              />
          </div>
        </div>

        <div className='glassjar__flex'> 
          {(type === "withdrawal" || type === "transfer") && (
            <div className="glassjar__form__input-group glassjar__form__input-group--drop">
              <label htmlFor="fromAccount">From Account:</label>
              <select
                id="fromAccount"
                value={fromAccount}
                onChange={(e) => {setFromAccount(e.target.value)}}
                
              >
                {accounts.map((account: Account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(type === "deposit" || type === "transfer") && (
            <div className="glassjar__form__input-group glassjar__form__input-group--drop">
              <label htmlFor="toAccount">To Account:</label>
              <select
                id="toAccount"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
              >
                {accounts.map((account: Account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="glassjar__form__input-group">
          <label htmlFor="description">Description (optional):</label>
          <input
            placeholder='Description (optional)'
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="glassjar__form__input-group glassjar__form__input-group--check">
          <label htmlFor="isRecurring">Transaction Repeats:</label>
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
        </div>

        {isRecurring && (
          <div className='glassjar__flex'>
            <div className="glassjar__form__input-group glassjar__form__input-group--drop">
              <label htmlFor="recurrenceFrequency">Repeats:</label>
              <select
                id="recurrenceFrequency"
                value={recurrenceFrequency}
                onChange={(e) =>
                  setRecurrenceFrequency(
                    e.target.value as
                      | "daily"
                      | "weekly"
                      | "monthly"
                      | "yearly"
                  )
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="glassjar__form__input-group">
              <label htmlFor="endDate">End Date (optional):</label>
              <input
                type="date"
                id="endDate"
                value={endDate ? stripTime(endDate) : ""}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="glassjar__flex glassjar__flex--justify-center">
          {/* <button onClick={onClose}>Close</button> */}
          {activeTransaction && (
            <button
              type="button"
              onClick={() => {
                dispatch(deleteTransaction(activeTransaction.id));
                onClose();
              }}
            >
              Delete
            </button>
          )}
          <button type="submit">Submit</button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;

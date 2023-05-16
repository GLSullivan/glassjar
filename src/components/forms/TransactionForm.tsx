import React, { useEffect, useState }                             from 'react';
import { useDispatch, useSelector }                               from 'react-redux';
import CurrencyInput                                              from 'react-currency-input-field';

import { Transaction }                                            from './../../models/Transaction';
import { addTransaction, updateTransaction, deleteTransaction }   from './../../redux/slices/transactions';
import { RootState }                                              from './../../redux/store';
import { stripTime, addZoneOffset }                               from './../../utils/dateUtils';
import { Account }                                                from './../../models/Account';
import { RecurringExpenses }                                      from './../../data/RecurringExpenses';

import './../../css/Forms.css';

interface TransactionFormProps {
  onClose: () => void;
  initialDate?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, initialDate }) => {
  const activeTransaction = useSelector((state: RootState) => state.transactions.activeTransaction);
  const accounts          = useSelector((state: RootState) => state.accounts.accounts);

  const [transactionName, setTransactionName]                 = useState(activeTransaction?.transactionName || '');
  const [date, setDate]                                       = useState(() => {
                                                                if (activeTransaction?.date) {
                                                                  return new Date(activeTransaction.date).toISOString();
                                                                }
                                                                if (initialDate) {
                                                                  return new Date(initialDate).toISOString();
                                                                }
                                                                return '';
                                                              });
  const [type, setType]                                       = useState(activeTransaction?.type || 'withdrawal');
  const [category, setCategory]                               = useState(activeTransaction?.category || 'None');
  const [amount, setAmount]                                   = useState(activeTransaction?.amount || 0);
  const [fromAccount, setFromAccount]                         = useState(activeTransaction?.fromAccount || '');
  const [toAccount, setToAccount]                             = useState(activeTransaction?.toAccount || '');
  const [description, setDescription]                         = useState(activeTransaction?.description || '');
  const [isRecurring, setIsRecurring]                         = useState(activeTransaction?.isRecurring || false);
  const [endDate, setEndDate]                                 = useState(activeTransaction?.endDate || '');
  const [recurrenceFrequency, setRecurrenceFrequency]         = useState(activeTransaction?.recurrenceFrequency || 'monthly');
  const [recurrenceInterval, setRecurrenceInterval]           = useState<number>(activeTransaction?.recurrenceInterval || 1);
  const [customIntervalType, setCustomIntervalType]           = useState(activeTransaction?.customIntervalType || 'week');
  const [recurrenceIntervalInput, setRecurrenceIntervalInput] = useState<string>(activeTransaction?.recurrenceInterval?.toString() || '1');
  const [selectedDays, setSelectedDays]                       = useState<number[]>(activeTransaction?.givenDays || []);

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
      ...(recurrenceFrequency === 'custom' && { recurrenceInterval }),
      customIntervalType,
      allowOverpayment: false,
      showInCalendar: true,
      category,
    };
  
    // Include givenDays in the transaction data when the recurrenceFrequency is set to 'given days'
    if (recurrenceFrequency === 'given days') {
      const sortedGivenDays = [...selectedDays].sort((a, b) => a - b);
      transactionData.givenDays = sortedGivenDays;
    }
  
    if (activeTransaction) {
      dispatch(updateTransaction(transactionData));
    } else {
      dispatch(addTransaction(transactionData));
    }
  
    onClose();
  };
  
  
  useEffect(() => {
    if (!activeTransaction && accounts.length > 1) {
      setFromAccount(accounts[0].id);
      setToAccount(accounts[1].id);
    }
  }, [activeTransaction, accounts]);

  const handleRecurrenceIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecurrenceIntervalInput(value);
    setRecurrenceInterval(value === "" ? 1 : parseInt(value));
  };

  useEffect(() => {
    if (activeTransaction && activeTransaction.givenDays) {
      setSelectedDays(activeTransaction.givenDays);
    } else {
      setSelectedDays([]);
    }
  }, [activeTransaction]);

  const toggleDay = (day: number) => {
    setSelectedDays((prevState) => {
      if (prevState.includes(day)) {
        return prevState.filter((d) => d !== day);
      } else {
        return [...prevState, day];
      }
    });
  };

  return (
    <div className="glassjar__form">
      <h2>
        {activeTransaction
          ? `${activeTransaction.transactionName}`
          : "New Transaction"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="glassjar__form__input-group">
          <label htmlFor="transactionName">Transaction Name:</label>
          <input
            placeholder="Transaction Name"
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

        <div className="glassjar__flex">
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
              <option value="deposit">Income</option>
              <option value="withdrawal">Expense</option>
              {accounts.length > 1 && (<option value="transfer">Transfer</option>)}              
              <option value="event">Event</option>
            </select>
          </div>

          {type != "event" && <div className="glassjar__form__input-group">
            <label htmlFor="amount">Amount:</label>
            <CurrencyInput
              id="amount"
              prefix="$"
              name="amount"
              placeholder="Transaction Amount:"
              defaultValue={amount / 100} // Convert cents to dollars for display
              decimalsLimit={2} // Allow decimal input
              onValueChange={(value) =>
                setAmount(value ? Math.round(parseFloat(value) * 100) : 0)
              }
            />
          </div>}
        </div>

        {(type === "withdrawal" || type === "transfer") && (
          <div className="glassjar__form__input-group glassjar__form__input-group--drop">
            <label htmlFor="fromAccount">From Account:</label>
            <select
              id="fromAccount"
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

        {(type === "withdrawal" || type === "transfer") && <div className="glassjar__flex">
          <div className="glassjar__form__input-group glassjar__form__input-group--drop">
            <label htmlFor="category">Category:</label>
            <select
              id="category"
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
            >
              {RecurringExpenses.map((category, index) => (
                <option key={index} value={RecurringExpenses[index].category}>{RecurringExpenses[index].category}</option>
              ))}
            </select>
          </div>
        </div>}

        <div className="glassjar__form__input-group">
          <label htmlFor="description">Description (optional):</label>
          <input
            placeholder="Description (optional)"
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
          <>
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
                      | "given days" 
                      | "twice monthly"
                      | "custom"
                    )
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="given days">Certain Days</option>
                  <option value="twice monthly">Twice Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {recurrenceFrequency === "given days" && (
                <div className="glassjar__form__input-group">
                  <label>Days:</label>
                  <div className='glassjar__day-buttons'>
                    {["S", "M", "T", "W", "T", "F", "S"].map(
                      (dayName, index) => (
                        <button
                          key={`${dayName}-${index}`}
                          type="button"
                          className={selectedDays.includes(index) ? "selected" : ""}
                          onClick={() => toggleDay(index)}
                        >
                          {dayName}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            }

            {recurrenceFrequency === 'custom' && (
              <>
                <div className='glassjar__flex'>
                  <label htmlFor="recurrenceInterval">Every:</label>
                  <div className="glassjar__form__input-group">
                  <input
                    type="number"
                    id="recurrenceInterval"
                    value={recurrenceIntervalInput}
                    min="1"
                    onChange={handleRecurrenceIntervalChange}
                  />

                  </div>
                  <div className="glassjar__form__input-group glassjar__form__input-group--drop">
                    <select
                      value={customIntervalType}
                      onChange={(e) =>
                        setCustomIntervalType(e.target.value as 'day' | 'week' | 'month' | 'year')
                      }
                    >
                      <option value="day">Day(s)</option>
                      <option value="week">Week(s)</option>
                      <option value="month">Month(s)</option>
                      <option value="year">Year(s)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            
            <div className="glassjar__form__input-group">
              <label htmlFor="endDate">End Date (optional):</label>
              <input
                type="date"
                id="endDate"
                value={endDate ? stripTime(endDate) : ""}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
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

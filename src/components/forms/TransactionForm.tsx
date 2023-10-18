import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector }            from 'react-redux';

import CurrencyInput                           from 'react-currency-input-field';
import { Transaction }                         from './../../models/Transaction';
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
}                                              from './../../redux/slices/transactions';
import { RecurringExpenses }                   from './../../data/RecurringExpenses';
import { stripTime }                           from './../../utils/dateUtils'; // TODO: This is in Date-fns, use that!
import { Account }                             from './../../models/Account';
import { RootState }                           from './../../redux/store';
import PanelHeader                             from './../PanelHeader';

import {
  RecurrenceFrequency,
  CustomIntervalType,
  TransactionType,
}                                              from './../../utils/constants';

import './../../css/Forms.css';

interface TransactionFormProps {
  onClose               : () => void;
  initialDate          ?: string;
  initialArbitraryDates?: string[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onClose,
  initialDate,
}) => {
  const dispatch = useDispatch();

  const accounts          = useSelector((state: RootState) => state.accounts.accounts);
  const activeTransaction = useSelector((state: RootState) => state.transactions.activeTransaction);

  const [saveReady, setSaveReady] = useState<boolean>(false);

  const addArbitraryDate = () => {
    setArbitraryDates((prevState) => [...prevState, '']); // Default to empty string, you can set a default date here
  };

  const removeArbitraryDate = (index: number) => {
    setArbitraryDates((prevState) => prevState.filter((_, i) => i !== index));
  };

  const [arbitraryDates, setArbitraryDates] = useState<string[]>(
    activeTransaction?.arbitraryDates || []
  );

  const initialTransaction = activeTransaction || {
    transactionName    : '',
    event_id           : new Date().toISOString(),
    type               : TransactionType.WITHDRAWAL,
    amount             : 0,
    date               : initialDate || new Date().toISOString(),
    description        : '',
    isRecurring        : false,
    ends               : false,
    showInCalendar     : true,
    recurrenceFrequency: RecurrenceFrequency.MONTHLY,
    customIntervalType : CustomIntervalType.DAY,
    givenDays          : [],
    recurrenceInterval : 1,
    endDate            : '',
    fromAccount        : accounts[0].id,
    toAccount          : accounts[0].id,
    category           : '',
    arbitraryDates     : [],
    fromHelper         : '',
    autoClear          : true,
    clearedDates       : [],
    rrule              : ''
  };

  const [transaction, setTransaction] = useState<Transaction>(initialTransaction);
  // eslint-disable-next-line
  const initialTransactionData        = useMemo(() => initialTransaction, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setTransaction({ ...transaction, [target.name]: target.checked });
    } else {
      setTransaction({ ...transaction, [target.name]: target.value });
    }
  };

  const handleCurrencyChange = (
    value : string | undefined,
    name ?: string | undefined
  ) => {
    if (name && value !== undefined) {
      setTransaction({
        ...transaction,
        [name]: parseFloat(value) ? Math.round(parseFloat(value) * 100): 0,
      });
    } else if (name) {
      setTransaction({ ...transaction, [name]: '' });
    }
  };

  const handleArbitraryDateChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = event.target.value;
  
    // Update the arbitraryDates state
    setArbitraryDates((prevDates) => {
      // Create a new array with the updated date
      const updatedArbitraryDates = prevDates.map((date, i) =>
        i === index ? value : date
      );
  
      // Sort the array in ascending order
      const sortedArbitraryDates = [...updatedArbitraryDates].sort();
  
      // Update the transaction state with the new sorted arbitraryDates
      setTransaction({
        ...transaction,
        arbitraryDates: sortedArbitraryDates,
      });
  
      return sortedArbitraryDates;
    });
  };
  
  const toggleDay = (dayNumber: number) => {
    let newGivenDays = transaction.givenDays ? [...transaction.givenDays] : [];

    const index = newGivenDays.indexOf(dayNumber);

    if (index !== -1) {
        // Remove the dayNumber from the array
    } else {
      newGivenDays.push(dayNumber);
    }

    newGivenDays.sort((a, b) => a - b);

    setTransaction({
      ...transaction,
      givenDays: newGivenDays,
    });
  };
  
  // Error Checking

  interface ErrorState {
    transactionName: string | null;
    amount         : string | null;
    transfer       : string | null;
  }

  const [errors, setErrors] = useState<ErrorState>({
    transactionName: null,
    amount         : null,
    transfer       : null,
  });

  useEffect(() => {
    if (!transaction) {
      return;
    }

    let newErrors: ErrorState = {
      transactionName: null,
      amount         : null,
      transfer       : null,
    };

    if (
      typeof transaction.transactionName !== 'string' ||
      !transaction.transactionName ||
      transaction.transactionName.trim() === ''
    ) {
      newErrors.transactionName = 'Name is required.';
    }

    if (
      typeof transaction.amount !== 'number' ||
      !Number.isInteger(transaction.amount) ||
      transaction.amount <= 0
    ) {
      newErrors.amount = 'Amount required.';
    }

    if (
      transaction.type      === TransactionType.TRANSFER &&
      transaction.toAccount === transaction.fromAccount
    ) {
      newErrors.transfer = "From and To Account can't match.";
    }

    const conditions  = Object.values(newErrors).map((error) => error === null);
    const isSaveReady = conditions.every(Boolean);

    setErrors({ ...newErrors });

    if (
      JSON.stringify(transaction) !== JSON.stringify(initialTransactionData) &&
      isSaveReady
    ) {
      setSaveReady(true);
    } else {
      setSaveReady(false);
    }

      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction]);

  const handleSave = () => {
    if (saveReady) {
      if (activeTransaction) {
        dispatch(updateTransaction(transaction));
      } else {
        dispatch(addTransaction(transaction));
      }
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <>
      <PanelHeader
        title                = {activeTransaction ? `Update Transaction` : 'New Transaction'}
        onSecondaryAction    = {onClose}
        secondaryActionLabel = "Cancel"
        onPrimaryAction      = {handleSave}
        disablePrimaryButton = {!saveReady}
        primaryActionLabel   = "Save"
      />

      <div  className = "glassjar__padding">
      <form className = "glassjar__margin-gap" onSubmit = {handleSubmit}>
      <div  className = "glassjar__form__input-group">
            <input
              placeholder = "Transaction Name"
              type        = "text"
              id          = "transactionName"
              name        = "transactionName"
              value       = {transaction.transactionName}
              className   = {errors.transactionName ? 'error' : ''}
              onChange    = {handleChange}
            />
            <label htmlFor = "transactionName">
              Transaction Name: {' '}
              <span className = "glassjar__form__input-group__error">
                {errors.transactionName}
              </span>
            </label>
          </div>

          <div   className = "glassjar__flex glassjar__flex--even glassjar__flex--tight">
          <div   className = "glassjar__form__input-group glassjar__form__input-group--drop">
          <label htmlFor   = "type">Type:</label>
              <select
                id       = "type"
                name     = "type"
                value    = {transaction.type}
                onChange = {handleChange}
              >
                <option value = "deposit">Income</option>
                <option value = "withdrawal">Expense</option>
                {accounts.length > 1 && (
                  <option value = "transfer">Transfer</option>
                )}
                <option value = "event">Event</option>
              </select>
            </div>

            <div className = "glassjar__form__input-group glassjar__form__input-group--date">
              <input
                type     = "date"
                id       = "date"
                name     = "date"
                value    = {stripTime(transaction.date)}
                onChange = {handleChange}
              />
              <label htmlFor = "date">Date:</label>
            </div>
          </div>

          <div
            className={`glassjar__auto-height glassjar__auto-height--top ${
              transaction.type !== 'event' ? 'open' : ''
            }`}
          >
            <div className = "glassjar__form__input-group">
              <CurrencyInput
                id            = "amount"
                prefix        = "$"
                name          = "amount"
                placeholder   = "Transaction Amount:"
                defaultValue  = {transaction.amount / 100}
                className     = {errors.amount ? 'error' : ''}
                decimalsLimit = {2}
                onValueChange = {handleCurrencyChange}
              />
              <label htmlFor = "amount">
                Amount: {' '}
                <span className = "glassjar__form__input-group__error">
                  {errors.amount}
                </span>
              </label>
            </div>
          </div>

          <div
            className={`glassjar__auto-height glassjar__auto-height--top ${
              errors.transfer ? 'open': ''
            }`}
          >
            <span className = "glassjar__form__input-group__error">
              {errors.transfer ? <>{errors.transfer}</> : <> </>}
            </span>
          </div>

          <div className = "glassjar__flex glassjar__flex--tight">
            {(transaction.type === TransactionType.WITHDRAWAL ||
              transaction.type === TransactionType.TRANSFER) && (
              <div   className = "glassjar__form__input-group glassjar__form__input-group--drop">
              <label htmlFor   = "fromAccount">From Account:</label>
                <select
                  id        = "fromAccount"
                  className = {errors.transfer ? 'error' : ''}
                  value     = {transaction.fromAccount}
                  onChange  = {handleChange}
                >
                  {accounts.map((account: Account) => (
                    <option key = {account.id} value = {account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(transaction.type === TransactionType.DEPOSIT ||
              transaction.type === TransactionType.TRANSFER) && (
              <div   className = "glassjar__form__input-group glassjar__form__input-group--drop">
              <label htmlFor   = "toAccount">To Account:</label>
                <select
                  id        = "toAccount"
                  className = {errors.transfer ? 'error' : ''}
                  value     = {transaction.toAccount}
                  onChange  = {handleChange}
                >
                  {accounts.map((account: Account) => (
                    <option key = {account.id} value = {account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className = "glassjar__form__input-sub-group">
          <div className = "glassjar__form__input-group glassjar__form__input-group--check">
              <input
                type     = "checkbox"
                name     = "isRecurring"
                id       = "isRecurring"
                checked  = {transaction.isRecurring}
                onChange = {handleChange}
              />
              <label htmlFor = "isRecurring">Transaction Repeats:</label>
            </div>

            <div
              className={`glassjar__auto-height ${
                transaction.isRecurring ? 'open': ''
              }`}
            >
              <div className = "glassjar__margin-gap">
              <div className = "glassjar__form__input-group glassjar__form__input-group--drop">
                  <select
                    id       = "recurrenceFrequency"
                    name     = "recurrenceFrequency"
                    value    = {transaction.recurrenceFrequency}
                    onChange = {handleChange}
                  >
                    <option value = {RecurrenceFrequency.DAILY}>Daily</option>
                    <option value = {RecurrenceFrequency.WEEKLY}>Weekly</option>
                    <option value = {RecurrenceFrequency.MONTHLY}>Monthly</option>
                    <option value = {RecurrenceFrequency.YEARLY}>Yearly</option>
                    <option value = {RecurrenceFrequency.GIVEN_DAYS}>
                      Certain Days
                    </option>
                    <option value = {RecurrenceFrequency.TWICE_MONTHLY}>
                      Twice Monthly
                    </option>
                    <option value = {RecurrenceFrequency.CUSTOM}>Custom</option>
                    <option value = {RecurrenceFrequency.ARBITRARY}>
                      Arbitrary
                    </option>
                  </select>
                  <label htmlFor = "recurrenceFrequency">Repeats:</label>
                </div>
                <div
                  className={`glassjar__auto-height ${
                    transaction.recurrenceFrequency === 
                    RecurrenceFrequency.GIVEN_DAYS
                      ? 'open'
                      :  ''
                  }`}
                >
                  <div className = "glassjar__form__input-group">
                    <label>Days: </label>
                    <div className = "glassjar__flex glassjar__flex--even glassjar__flex--tight">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(
                        (dayName, index) => (
                          <button
                            key       = {`${dayName}-${index}`}
                            type      = "button"
                            className = {
                              transaction.givenDays?.includes(index)
                                ? 'selected'
                                :  ''
                            }
                            onClick = {() => toggleDay(index)}
                          >
                            {dayName}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`glassjar__auto-height ${
                    transaction.recurrenceFrequency === 
                    RecurrenceFrequency.CUSTOM
                      ? 'open'
                      :  ''
                  }`}
                >
                  <div className = "glassjar__flex">
                  <div className = "glassjar__form__input-group">
                      <input
                        type     = "number"
                        id       = "recurrenceInterval"
                        name     = "recurrenceInterval"
                        value    = {transaction.recurrenceInterval}
                        min      = "1"
                        onChange = {handleChange}
                      />
                      <label htmlFor = "recurrenceInterval">Every:</label>
                    </div>
                    <div className = "glassjar__form__input-group glassjar__form__input-group--drop">
                      <select
                        id       = "customIntervalType"
                        name       = "customIntervalType"
                        value    = {transaction.customIntervalType}
                        onChange = {handleChange}
                      >
                        <option value = "day">Day(s)</option>
                        <option value = "week">Week(s)</option>
                        <option value = "month">Month(s)</option>
                        <option value = "year">Year(s)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div
                  className={`glassjar__auto-height ${
                    transaction.recurrenceFrequency === 
                    RecurrenceFrequency.ARBITRARY
                      ? 'open'
                      :  ''
                  }`}
                >
                  <div className="glassjar__flex glassjar__flex--column glassjar__flex--tight">

                  {[...arbitraryDates].sort().map((date, index) => (
                      <div
                        className="glassjar__flex glassjar__flex--tight glassjar__flex--align-center"
                        key={index}
                      >
                        <div className="glassjar__form__input-group">
                          <input
                            type="date"
                            name="date"
                            value={date}
                            onChange={(e) => handleArbitraryDateChange(e, index)}
                          />
                          <label>Arbitrary Date: </label>
                        </div>
                        <button
                          className="glassjar__button glassjar__button--small glassjar__button--warn"
                          type="button"
                          onClick={() => removeArbitraryDate(index)} // Here, 'index' is a number, which should be acceptable now
                        >
                          <i className="fa-solid fa-xmark-large" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addArbitraryDate}>
                      Add Date
                    </button>
                  </div>
                </div>
                <div>
                  <div className = "glassjar__form__input-group glassjar__form__input-group--check">
                    <input
                      type     = "checkbox"
                      id       = "ends"
                      name     = "ends"
                      checked  = {transaction.ends}
                      onChange = {handleChange}
                    />
                    <label htmlFor = "ends">End Date:</label>
                  </div>

                  <div
                    className={`glassjar__auto-height ${
                      transaction.ends ? 'open': ''
                    }`}
                  >
                    <div className = "glassjar__form__input-group">
                      <input
                        type  = "date"
                        id    = "endDate"
                        name  = "endDate"
                        value = {
                          transaction.endDate
                            ? stripTime(transaction.endDate)
                            :  ''
                        }
                        onChange = {handleChange}
                      />
                      <label htmlFor = "endDate">Transaction Ends:</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`glassjar__auto-height glassjar__auto-height--top ${
              transaction.type === 'withdrawal' ||
              transaction.type === 'transfer'
                ? 'open'
                :  ''
            }`}
          >
            <div   className = "glassjar__form__input-group glassjar__form__input-group--drop">
            <label htmlFor   = "category">Category:</label>
              <select
                id       = "category"
                name     = "category"
                value    = {transaction.category}
                onChange = {handleChange}
              >
                {RecurringExpenses.map((category, index) => (
                  <option key = {index} value = {RecurringExpenses[index].category}>
                    {RecurringExpenses[index].category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className = "glassjar__form__input-group glassjar__form__input-group--check">
            <input
              type     = "checkbox"
              id       = "showInCalendar"
              name     = "showInCalendar"
              checked  = {transaction.showInCalendar}
              onChange = {handleChange}
            />
            <label htmlFor = "showInCalendar">Show In Schedule:</label>
          </div>

          <div className = "glassjar__form__input-group">
            <textarea
              placeholder           = "Description (optional)"
              id                    = "description"
              name                  = "description"
              value                 = {transaction.description}
              data-gramm            = "false"
              data-gramm_editor     = "false"
              data-enable-grammarly = "false"
              onChange              = {handleChange}
            />
            <label htmlFor = "description">Description (optional):</label>
          </div>

          <div className = "glassjar__flex glassjar__flex--justify-center">
            {activeTransaction && (
              <button
                className = "glassjar__text-button glassjar__text-button--warn"
                type      = "button"
                onClick   = {() => {
                  dispatch(deleteTransaction(activeTransaction.event_id));
                  onClose();
                }}
              >
                Delete Transaction
              </button>
            )}
          </div>
          <input type = "submit" hidden />
        </form>
      </div>
    </>
  );
};

export default TransactionForm;

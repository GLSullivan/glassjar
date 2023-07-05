import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CurrencyInput from "react-currency-input-field";

import { Transaction } from "./../../models/Transaction";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "./../../redux/slices/transactions";
import { RootState } from "./../../redux/store";
import { stripTime, addZoneOffset } from "./../../utils/dateUtils";
import { Account } from "./../../models/Account";
import { RecurringExpenses } from "./../../data/RecurringExpenses";
import {
  RecurrenceFrequency,
  CustomIntervalType,
  TransactionType,
} from "./../../utils/constants";

import { format } from "date-fns-tz";
import { isPast, add, parseISO } from "date-fns";

import "./../../css/Forms.css";

interface TransactionFormProps {
  onClose: () => void;
  initialDate?: string;
  initialArbitraryDates?: string[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onClose,
  initialDate,
}) => {
  const activeTransaction = useSelector(
    (state: RootState) => state.transactions.activeTransaction
  );
  const accounts = useSelector((state: RootState) => state.accounts.accounts);

  const [transactionName, setTransactionName] = useState(
    activeTransaction?.transactionName || ""
  );
  const [date, setDate] = useState(() => {
    if (activeTransaction?.date) {
      return new Date(activeTransaction.date).toISOString();
    }
    if (initialDate) {
      return new Date(initialDate).toISOString();
    }
    return "";
  });
  const [type, setType] = useState(activeTransaction?.type || "withdrawal");
  const [category, setCategory] = useState(
    activeTransaction?.category || "None"
  );
  const [amount, setAmount] = useState(activeTransaction?.amount || 0);
  const [fromAccount, setFromAccount] = useState(
    activeTransaction?.fromAccount || accounts[0].id
  );
  const [toAccount, setToAccount] = useState(
    activeTransaction?.toAccount || accounts[0].id
  );
  const [description, setDescription] = useState(
    activeTransaction?.description || ""
  );
  const [isRecurring, setIsRecurring] = useState(
    activeTransaction?.isRecurring || false
  );
  const [ends, setEnds] = useState(activeTransaction?.isRecurring || false);
  const [endDate, setEndDate] = useState(activeTransaction?.endDate || "");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(
    activeTransaction?.recurrenceFrequency || "monthly"
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(
    activeTransaction?.recurrenceInterval || 1
  );
  const [customIntervalType, setCustomIntervalType] = useState(
    activeTransaction?.customIntervalType || "week"
  );
  const [recurrenceIntervalInput, setRecurrenceIntervalInput] =
    useState<string>(activeTransaction?.recurrenceInterval?.toString() || "1");
  const [selectedDays, setSelectedDays] = useState<number[]>(
    activeTransaction?.givenDays || []
  );
  const [arbitraryDates, setArbitraryDates] = useState<string[]>(
    activeTransaction?.arbitraryDates || []
  );

  const addArbitraryDate = (date: string) => {
    setArbitraryDates((prevState) => [...prevState, date]);
  };

  const removeArbitraryDate = (date: string) => {
    setArbitraryDates((prevState) => prevState.filter((d) => d !== date));
  };

  const dispatch = useDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const localDate = new Date(date);
    const isoDate = localDate.toISOString();

    const localEndDate = endDate ? new Date(endDate) : undefined;
    const isoEndDate = localEndDate ? localEndDate.toISOString() : "";

    const transactionData: Transaction = {
      transactionName,
      date: isoDate,
      type,
      amount,
      description,
      fromAccount: fromAccount,
      toAccount: toAccount,
      id: activeTransaction ? activeTransaction.id : new Date().getTime(),
      isRecurring,
      endDate: isoEndDate,
      recurrenceFrequency,
      ...(recurrenceFrequency === "custom" && { recurrenceInterval }),
      customIntervalType,
      allowOverpayment: false,
      showInCalendar: true,
      category,
      arbitraryDates,
    };

    // Include givenDays in the transaction data when the recurrenceFrequency is set to 'given days'
    if (recurrenceFrequency === "given days") {
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

  const handleRecurrenceIntervalChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const onEndDateChange = (e: any) => {
    let selectedDate = parseISO(e.target.value);

    if (isPast(selectedDate)) {
      let nextDay = add(parseISO(date), { days: 1 });
      setEndDate(format(nextDay, "yyyy-MM-dd"));
    } else {
      setEndDate(e.target.value);
    }
  };

  useEffect(() => {
    if (!ends) {
      setEndDate("");
    }
  }, [ends]);

  return (
    <>
      <h2>
        {activeTransaction
          ? `${activeTransaction.transactionName}`
          : "New Transaction"}
      </h2>
      <form className="glassjar__form" onSubmit={handleSubmit}>
        <div className="glassjar__form__input-group">
          <input
            placeholder="Transaction Name"
            type="text"
            id="transactionName"
            value={transactionName}
            onChange={(e) => setTransactionName(e.target.value)}
          />
          <label htmlFor="transactionName">Transaction Name:</label>
        </div>

        <div className="glassjar__form__input-group glassjar__form__input-group--date">
          <input
            type="date"
            id="date"
            value={stripTime(date)}
            onChange={(e) => setDate(addZoneOffset(e.target.value))}
          />
          <label htmlFor="date">Date:</label>
        </div>

        <div className="glassjar__flex">
          <div className="glassjar__form__input-group glassjar__form__input-group--drop">
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
            >
              <option value="deposit">Income</option>
              <option value="withdrawal">Expense</option>
              {accounts.length > 1 && (
                <option value="transfer">Transfer</option>
              )}
              <option value="event">Event</option>
            </select>
          </div>

          {type !== "event" && (
            <div className="glassjar__form__input-group">
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
              <label htmlFor="amount">Amount:</label>
            </div>
          )}
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

        <div className="glassjar__form__input-group glassjar__form__input-group--check">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(!isRecurring)}
          />
          <label htmlFor="isRecurring">Transaction Repeats:</label>
        </div>

        {isRecurring && (
          <>
            <div className="glassjar__form__input-group glassjar__form__input-group--drop">
              {/* <label htmlFor="recurrenceFrequency">Repeats:</label> */}
              <select
                id="recurrenceFrequency"
                value={recurrenceFrequency}
                onChange={(e) =>
                  setRecurrenceFrequency(e.target.value as RecurrenceFrequency)
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="given days">Certain Days</option>
                <option value="twice monthly">Twice Monthly</option>
                <option value="custom">Custom</option>
                <option value="arbitrary">Arbitrary</option>
              </select>
              <label htmlFor="recurrenceFrequency">Repeats:</label>
            </div>

            {recurrenceFrequency === "given days" && (
              <div className="glassjar__form__input-group">
                <label>Days:</label>
                <div className="glassjar__day-buttons">
                  {["S", "M", "T", "W", "T", "F", "S"].map((dayName, index) => (
                    <button
                      key={`${dayName}-${index}`}
                      type="button"
                      className={selectedDays.includes(index) ? "selected" : ""}
                      onClick={() => toggleDay(index)}
                    >
                      {dayName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recurrenceFrequency === "custom" && (
              <>
                <div className="glassjar__flex">
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
                        setCustomIntervalType(
                          e.target.value as CustomIntervalType
                        )
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

            {recurrenceFrequency === "arbitrary" && (
              <>
                <div className="glassjar__flex glassjar__flex--column glassjar__flex--tight">
                  {arbitraryDates.map((date, index) => (
                    <div
                      className="glassjar__flex glassjar__flex--tight glassjar__flex--align-center"
                      key={index}
                    >
                      <div className="glassjar__form__input-group">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) =>
                            setArbitraryDates(
                              arbitraryDates.map((d, i) =>
                                i === index ? e.target.value : d
                              )
                            )
                          }
                        />
                        <label>Arbitrary Dates:</label>
                      </div>
                      <button
                        className="glassjar__button glassjar__button--small glassjar__button--warn"
                        type="button"
                        onClick={() => removeArbitraryDate(date)}
                      >
                        <i className="fa-solid fa-xmark-large" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => addArbitraryDate("")}>
                  Add Date
                </button>
              </>
            )}

            <div className="glassjar__form__input-group glassjar__form__input-group--check">
              <input
                type="checkbox"
                id="ends"
                checked={ends}
                onChange={(e) => setEnds(!ends)}
              />
              <label htmlFor="ends">End Date:</label>
            </div>
            {ends && (
              <div className="glassjar__form__input-group">
                <input
                  type="date"
                  id="endDate"
                  value={endDate ? stripTime(endDate) : ""}
                  onChange={onEndDateChange}
                />
                <label htmlFor="endDate">Transaction Ends:</label>
              </div>
            )}
          </>
        )}

        {(type === "withdrawal" || type === "transfer") && (
          <div className="glassjar__flex">
            <div className="glassjar__form__input-group glassjar__form__input-group--drop">
              <label htmlFor="category">Category:</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {RecurringExpenses.map((category, index) => (
                  <option key={index} value={RecurringExpenses[index].category}>
                    {RecurringExpenses[index].category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="glassjar__form__input-group">
          <textarea
            placeholder="Description (optional)"
            // type="text"
            id="description"
            value={description}
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            onChange={(e) => setDescription(e.target.value)}
          />
          <label htmlFor="description">Description (optional):</label>
        </div>
        <br />
        <div className="glassjar__flex glassjar__flex--justify-center">
          {activeTransaction && (
            <button
              className="glassjar__button glassjar__button--warn"
              type="button"
              onClick={() => {
                dispatch(deleteTransaction(activeTransaction.id));
                onClose();
              }}
            >
              Delete
            </button>
          )}
          <button
            className="glassjar__button glassjar__button--full-width glassjar__button--primary"
            type="submit"
          >
            Save
          </button>
        </div>
      </form>
    </>
  );
};

export default TransactionForm;

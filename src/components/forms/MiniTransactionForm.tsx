import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CurrencyInput from "react-currency-input-field";

import { addTransaction } from "../../redux/slices/transactions";
import { RootState } from "../../redux/store";
import { Transaction } from "../../models/Transaction";

import "./../../css/MiniForms.css";

interface MiniTransactionFormProps {
  initialName               ?: string;
  initialAmount             ?: number;
  initialDay                ?: string;
  initialType               ?: string;
  initialDescription        ?: string;
  initialFromAccount        ?: string;
  initialToAccount          ?: string;
  initialIsRecurring        ?: boolean;
  initialEndDate            ?: string;
  initialRecurrenceFrequency?: string;
  initialAllowOverpayment   ?: boolean;
  initialShowInCalendar     ?: boolean;
  initialCategory           ?: string;
}

const MiniTransactionForm: React.FC<MiniTransactionFormProps> = ({
  initialName                = "",
  initialAmount              = 0,
  initialDay                 = "",
  initialType                = "withdrawal",
  initialDescription         = "",
  initialFromAccount         = "",
  initialToAccount           = "",
  initialIsRecurring         = true,
  initialEndDate             = "",
  initialRecurrenceFrequency = "monthly",
  initialAllowOverpayment    = false,
  initialShowInCalendar      = true,
  initialCategory            = "None"
}) => {
  const accounts = useSelector((state: RootState) => state.accounts.accounts);
  const firstAccountId = accounts.length > 0 ? accounts[0].id : "";

  const [transactionName, setTransactionName]         = useState(initialName);
  const [day, setDay]                                 = useState(initialDay);
  const [amount, setAmount]                           = useState(initialAmount);
  
  const dispatch = useDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentDate = new Date();
    const nextTransactionDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      parseInt(day)
    );

    if (nextTransactionDate <= currentDate) {
      nextTransactionDate.setMonth(nextTransactionDate.getMonth() + 1);
    }

    const isoDate = nextTransactionDate.toISOString();

    const transactionData: Transaction = {
      transactionName,
      amount,
      date               : isoDate,
      type               : "withdrawal",
      description        : "",
      fromAccount        : firstAccountId,
      toAccount          : "",
      id                 : new Date().getTime(),
      isRecurring        : true,
      endDate            : "",
      recurrenceFrequency: "monthly",
      allowOverpayment   : false,
      showInCalendar     : true,
      category           : initialCategory,
    };

    dispatch(addTransaction(transactionData));
    // Isn't this a place to set a state for success? 
  };

  return (
    <form className="glassjar__mini-transaction" onSubmit={handleSubmit}>
      <div className="glassjar__form__input-group">
        {/* <label htmlFor="Name">Transaction Name:</label> */}
        <input
          placeholder="Name"
          type="text"
          value={transactionName}
          onChange={(e) => setTransactionName(e.target.value)}
        />
      </div>

      <div className="glassjar__mini-transaction__sub">
        <div className="glassjar__form__input-group glassjar__form__input-group--drop">
          <label htmlFor="due">Due On The:</label>
          <select id="due" onChange={(e) => setDay(e.target.value)}>
            <option value="1">1st</option>
            <option value="2">2nd</option>
            <option value="3">3rd</option>
            <option value="4">4th</option>
            <option value="5">5th</option>
            <option value="6">6th</option>
            <option value="7">7th</option>
            <option value="8">8th</option>
            <option value="9">9th</option>
            <option value="10">10th</option>
            <option value="11">11th</option>
            <option value="12">12th</option>
            <option value="13">13th</option>
            <option value="14">14th</option>
            <option value="15">15th</option>
            <option value="16">16th</option>
            <option value="17">17th</option>
            <option value="18">18th</option>
            <option value="19">19th</option>
            <option value="20">20th</option>
            <option value="21">21st</option>
            <option value="22">22nd</option>
            <option value="23">23rd</option>
            <option value="24">24th</option>
            <option value="25">25th</option>
            <option value="26">26th</option>
            <option value="27">27th</option>
            <option value="28">28th</option>
            <option value="29">29th</option>
            <option value="30">30th</option>
            <option value="31">31st</option>
          </select>
        </div>

        <div className="glassjar__form__input-group">
          <label htmlFor="amount">Amount:</label>
          <CurrencyInput
            prefix        = "$"
            id            = "amount"
            name          = "amount"
            placeholder   = "Amount"
            defaultValue  = {amount / 100}
            decimalsLimit = {2}
            onValueChange = {(value) =>
              setAmount(value ? Math.round(parseFloat(value) * 100) : 0)
            }
          />
        </div>

        <button type="submit">
          <i className="fa-solid fa-plus" />
        </button>
      </div>
    </form>
  );
};

export default MiniTransactionForm;

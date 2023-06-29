import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CurrencyInput from "react-currency-input-field";

import { addTransaction } from "../../redux/slices/transactions";
import { RootState } from "../../redux/store";
import { Transaction } from "../../models/Transaction";

import "./../../css/MiniForms.css";

interface MiniTransactionFormProps {
  initialName?: string;
  initialAmount?: number;
  initialDay?: string;
  initialType?: string;
  initialDescription?: string;
  initialFromAccount?: string;
  initialToAccount?: string;
  initialIsRecurring?: boolean;
  initialEndDate?: string;
  initialRecurrenceFrequency?: string;
  initialAllowOverpayment?: boolean;
  initialShowInCalendar?: boolean;
  initialCategory?: string;
  initialArbitraryDates?: string[];
}

const HolidayTransactionForm: React.FC<MiniTransactionFormProps> = ({
  initialName = "",
  initialAmount = 0,
  initialDay = "",
  initialType = "withdrawal",
  initialDescription = "",
  initialFromAccount = "",
  initialToAccount = "",
  initialIsRecurring = true,
  initialEndDate = "",
  initialRecurrenceFrequency = 'yearly',
  initialAllowOverpayment = false,
  initialShowInCalendar = true,
  initialCategory = "None",
  initialArbitraryDates = [],
}) => {
  const accounts = useSelector((state: RootState) => state.accounts.accounts);
  const firstAccountId = accounts.length > 0 ? accounts[0].id : "";

  let transactionName: string = initialName;
  const [amount, setAmount] = useState(initialAmount);

  const dispatch = useDispatch();

  const handleSubmit = (e: React.FormEvent) => {

    const isoDate = new Date(initialArbitraryDates[0]).toISOString();

    let tempRecurrenceFrequency: "monthly" | "daily" | "weekly" | "yearly" | "given days" | "twice monthly" | "custom" | "arbitrary" | undefined = 'yearly';

    if (initialArbitraryDates.length > 1) {
      tempRecurrenceFrequency = 'arbitrary'
    } else {
      initialArbitraryDates = [];
    }

    const transactionData: Transaction = {
      transactionName,
      amount,
      date: isoDate,
      type: "withdrawal",
      description: "",
      fromAccount: firstAccountId,
      toAccount: "",
      id: new Date().getTime(),
      isRecurring: true,
      endDate: "",
      recurrenceFrequency: tempRecurrenceFrequency,
      allowOverpayment: false,
      showInCalendar: true,
      category: initialCategory,
      arbitraryDates: initialArbitraryDates
    };

    dispatch(addTransaction(transactionData));
    // Isn't this a place to set a state for success?
  };

  return (
    <form className="glassjar__mini-transaction" onSubmit={handleSubmit}>
      <div className="glassjar__form__input-group">
        {/* <label htmlFor="Name">Transaction Name:</label> */}
        <h3>{transactionName}</h3>
      </div>

      <div className="glassjar__mini-transaction__sub">
        <div className="glassjar__form__input-group">
          <label htmlFor="amount">Amount:</label>
          <CurrencyInput
            prefix="$"
            id="amount"
            name="amount"
            placeholder="Amount"
            defaultValue={amount / 100}
            decimalsLimit={2}
            onValueChange={(value) =>
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

export default HolidayTransactionForm;

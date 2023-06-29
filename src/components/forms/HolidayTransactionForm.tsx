import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CurrencyInput from "react-currency-input-field";

import { addTransaction, updateTransaction } from "../../redux/slices/transactions";
import { RootState } from "../../redux/store";
import { Transaction } from "../../models/Transaction";
import { RecurrenceFrequency } from './../../utils/constants';

import "./../../css/MiniForms.css";

interface HolidayTransactionFormProps {
  initialName                ?: string;
  initialAmount              ?: number;
  initialDay                 ?: string;
  initialDate                ?: string;
  initialType                ?: string;
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
  initialActiveTransaction   ?: Transaction
}

const HolidayTransactionForm: React.FC<HolidayTransactionFormProps> = ({
  initialName           = "",
  initialAmount         = 0,
  initialCategory       = "None",
  initialArbitraryDates = [],
  isActive              = false,
  initialActiveTransaction,
  initialDate,
  initialRecurrenceFrequency
}) => {
  const accounts                = useSelector((state: RootState) => state.accounts.accounts);

  if (!initialDate && initialArbitraryDates.length > 0) {
    initialDate = initialArbitraryDates[0]; 
  }

  const activeTransaction = initialActiveTransaction;

  const dispatch = useDispatch();

  if (initialArbitraryDates.length > 1) {
    initialRecurrenceFrequency = 'arbitrary'
  } else {
    initialRecurrenceFrequency = 'yearly'
  }
  
    // const [transactionName, setTransactionName]                 = useState(activeTransaction?.transactionName || initialName);
    // const [date, setDate]                                       = useState(() => {
    //                                                               if (activeTransaction?.date) {
    //                                                                 return new Date(activeTransaction.date).toISOString();
    //                                                               }
    //                                                               if (initialDate) {
    //                                                                 return new Date(initialDate).toISOString();
    //                                                               }
    //                                                               if (initialArbitraryDates.length > 0) {
    //                                                                 return new Date(initialArbitraryDates[0]).toISOString();
    //                                                               }
    //                                                               return '';
    //                                                             });
    // const [type, setType]                                       = useState(activeTransaction?.type || 'withdrawal');
    // const [category, setCategory]                               = useState(activeTransaction?.category || 'None');
    const [amount, setAmount]                                   = useState(activeTransaction?.amount || initialAmount);
    // const [fromAccount, setFromAccount]                         = useState(activeTransaction?.fromAccount || accounts[0].id);
    // const [toAccount, setToAccount]                             = useState(activeTransaction?.toAccount || accounts[0].id);
    // const [description, setDescription]                         = useState(activeTransaction?.description || '');
    // const [isRecurring, setIsRecurring]                         = useState(activeTransaction?.isRecurring || true);
    // const [endDate, setEndDate]                                 = useState(activeTransaction?.endDate || '');
    // const [recurrenceFrequency, setRecurrenceFrequency]         = useState(activeTransaction?.recurrenceFrequency || initialRecurrenceFrequency);
    // const [recurrenceInterval, setRecurrenceInterval]           = useState<number>(activeTransaction?.recurrenceInterval || 1);
    // const [customIntervalType, setCustomIntervalType]           = useState(activeTransaction?.customIntervalType || 'week');
    // const [recurrenceIntervalInput, setRecurrenceIntervalInput] = useState<string>(activeTransaction?.recurrenceInterval?.toString() || '1');
    // const [selectedDays, setSelectedDays]                       = useState<number[]>(activeTransaction?.givenDays || []);
    // const [arbitraryDates, setArbitraryDates]                   = useState<string[]>(activeTransaction?.arbitraryDates || initialArbitraryDates);

    const transactionName         = activeTransaction?.transactionName || initialName;
    const date                    = activeTransaction?.date ? new Date(activeTransaction.date).toISOString() :
                                    initialDate                  ? new Date(initialDate).toISOString()                 : 
                                    initialArbitraryDates.length > 0 ? new Date(initialArbitraryDates[0]).toISOString(): 
                                    '';
    const type                    = activeTransaction?.type || 'withdrawal';
    const category                = activeTransaction?.category || 'None';
    // const amount                  = activeTransaction?.amount || initialAmount;
    const fromAccount             = activeTransaction?.fromAccount || accounts[0].id;
    const toAccount               = activeTransaction?.toAccount || accounts[0].id;
    const description             = activeTransaction?.description || '';
    const isRecurring             = activeTransaction?.isRecurring || true;
    const endDate                 = activeTransaction?.endDate || '';
    let recurrenceFrequency     = activeTransaction?.recurrenceFrequency || initialRecurrenceFrequency;
    // const recurrenceInterval      = activeTransaction?.recurrenceInterval || 1;
    const customIntervalType      = activeTransaction?.customIntervalType || 'week';
    // const recurrenceIntervalInput = activeTransaction?.recurrenceInterval?.toString() || '1';
    // const selectedDays            = activeTransaction?.givenDays || [];
    let arbitraryDates          = activeTransaction?.arbitraryDates || initialArbitraryDates;
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log(arbitraryDates);
    
      if (arbitraryDates.length > 1) {
        recurrenceFrequency = "arbitrary";
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
          date: isoDate,
          type,
          amount,
          description,
          fromAccount: fromAccount,
          toAccount: toAccount,
          id: activeTransaction ? activeTransaction.id : new Date().getTime(),
          isRecurring,
          endDate: endDate,
          recurrenceFrequency,
          // ...(recurrenceFrequency === "custom" && { recurrenceInterval }),
          customIntervalType,
          allowOverpayment: false,
          showInCalendar: true,
          category,
          arbitraryDates: newArbitraryDates,
        };
    
        if (activeTransaction) {
          dispatch(updateTransaction(transactionData));
        } else {
          dispatch(addTransaction(transactionData));
        }
    
      };


  return (
    <form  className={`glassjar__mini-transaction ${isActive ? "active" : ""}`} onSubmit={handleSubmit}>
      <div className="glassjar__form__input-group">
        {/* <label htmlFor="Name">Transaction Name:</label> */}
        <h3>{transactionName}</h3>
      </div>

      <div className="glassjar__mini-transaction__sub">
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
          {initialActiveTransaction ? <i className="fa-solid fa-floppy-disk" /> : <i className="fa-solid fa-plus" /> }
        </button>
      </div>
    </form>
  );
};

export default HolidayTransactionForm;

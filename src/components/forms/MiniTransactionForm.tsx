import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CurrencyInput from 'react-currency-input-field';

import { addTransaction } from '../../redux/slices/transactions';
import { RootState } from '../../redux/store';
import { Transaction } from '../../models/Transaction';

// import './../../css/MiniForms.css';

interface MiniTransactionFormProps {
  initialName?: string;
  initialAmount?: number;
  initialDay?: string;
}

const MiniTransactionForm: React.FC<MiniTransactionFormProps> = ({ initialName = '', initialAmount = 0, initialDay = '' }) => {
  const accounts = useSelector((state: RootState) => state.accounts.accounts);
  const firstAccountId = accounts.length > 0 ? accounts[0].id : '';

  const [transactionName, setTransactionName] = useState(initialName);
  const [day, setDay] = useState(initialDay);
  const [amount, setAmount] = useState(initialAmount);

  const dispatch = useDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentDate = new Date();
    const nextTransactionDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(day));

    if (nextTransactionDate <= currentDate) {
      nextTransactionDate.setMonth(nextTransactionDate.getMonth() + 1);
    }

    const isoDate = nextTransactionDate.toISOString();

    const transactionData: Transaction = {
      transactionName,
      date: isoDate,
      type: 'withdrawal',
      amount,
      description: '',
      fromAccount: firstAccountId,
      toAccount: '',
      id: new Date().getTime(),
      isRecurring: true,
      endDate: '',
      recurrenceFrequency: 'monthly',
      allowOverpayment: false,
      showInCalendar: true
    };

    dispatch(addTransaction(transactionData));

    setTransactionName('');
    setDay('');
    setAmount(0);
  };

  return (
    <form className="mini-transaction-form" onSubmit={handleSubmit}>
      <input
        placeholder="Name"
        type="text"
        value={transactionName}
        onChange={(e) => setTransactionName(e.target.value)}
      />
      <input
        placeholder="Day"
        type="number"
        min="1"
        max="31"
        value={day}
        onChange={(e) => setDay(e.target.value)}
      />
      <CurrencyInput
        prefix="$"
        name="amount"
        placeholder="Amount"
        defaultValue={amount / 100}
        decimalsLimit={2}
        onValueChange={(value) => setAmount(value ? Math.round(parseFloat(value) * 100) : 0)}
      />
      <button type="submit">Add</button>
    </form>
  );
};

export default MiniTransactionForm;

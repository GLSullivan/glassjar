import React, { useState } from 'react';

interface TransactionFormProps {
  onClose: () => void;
  onSubmitTransaction: (transactionData: {
    date: string;
    type: string;
    amount: number;
    fromAccount: string;
    toAccount: string;
    description: string;
  }) => void;
  initialDate?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onClose,
  onSubmitTransaction,
  initialDate,
}) => {
  const [date, setDate] = useState(initialDate || '');
  const [type, setType] = useState('Expense');
  const [amount, setAmount] = useState(0);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitTransaction({ date, type, amount, fromAccount, toAccount, description });
    onClose();
  };

  return (
    <div className="transaction-form-modal">
      <div className="transaction-form-modal__content">
        <h2>Create Transaction</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label htmlFor="type">Transaction Type:</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
            <option value="Transfer">Transfer</option>
          </select>

          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
          />

          {(type === 'Expense' || type === 'Transfer') && (
            <>
              <label htmlFor="fromAccount">From Account:</label>
              <input
                type="text"
                id="fromAccount"
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
              />
            </>
          )}

          {(type === 'Income' || type === 'Transfer') && (
            <>
              <label htmlFor="toAccount">To Account:</label>
              <input
                type="text"
                id="toAccount"
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
              />
            </>
          )}

          <label htmlFor="description">Description (optional):</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button type="submit">Submit</button>
          <button onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;

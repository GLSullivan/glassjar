import React, { useState }                                        from 'react';
import { useDispatch, useSelector }                               from 'react-redux';
import { Transaction }                                            from './../../models/Transaction';
import { addTransaction, updateTransaction, deleteTransaction }   from './../../redux/slices/transactions';
import { RootState }                                              from './../../redux/store'; 

import './../../css/Forms.css'
interface TransactionFormProps {
  onClose: () => void;
  initialDate?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onClose,
  initialDate,
}) => {
  const activeTransaction = useSelector((state: RootState) => state.transactions.activeTransaction);

  const [transactionName, setTransactionName] = useState(activeTransaction?.transactionName || '');
  const [date, setDate] = useState(
    activeTransaction?.date
      ? new Date(activeTransaction.date).toISOString().split('T')[0]
      : initialDate || ''
  );
  const [type, setType] = useState(activeTransaction?.type === 'deposit' ? 'Income' : 'Expense');
  const [amount, setAmount] = useState(activeTransaction?.amount || 0);
  const [fromAccount, setFromAccount] = useState(activeTransaction?.fromAccount || '');
  const [toAccount, setToAccount] = useState(activeTransaction?.toAccount || '');
  const [description, setDescription] = useState(activeTransaction?.description || '');
  const [isRecurring, setIsRecurring] = useState(activeTransaction?.isRecurring || false);
  const [endDate, setEndDate] = useState(activeTransaction?.endDate || '');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(activeTransaction?.recurrenceFrequency || undefined);

  const dispatch = useDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const transactionData: Transaction = {
      transactionName,
      date,
      type: type === 'Income' ? 'deposit' : 'withdrawal',
      amount,
      description,
      fromAccount,
      toAccount,
      id: activeTransaction ? activeTransaction.id : new Date().getTime(),
      accountId: activeTransaction ? activeTransaction.accountId : '',
      isRecurring,
      endDate,
      recurrenceFrequency,
    };

    if (type === 'Expense' || type === 'Transfer') {
      transactionData.fromAccount = fromAccount;
    }

    if (type === 'Income' || type === 'Transfer') {
      transactionData.toAccount = toAccount;
    }

    if (activeTransaction) {
      dispatch(updateTransaction(transactionData));
    } else {
      dispatch(addTransaction(transactionData));
    }

    onClose();
  };

  return (
    <div className='glassjar__transaction-form'>
      <h2>
        {activeTransaction ? `${activeTransaction.transactionName}` : "New Transaction"}
      </h2>
      <form onSubmit={handleSubmit}>

        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="transactionName"
            value={transactionName}
            onChange={(e) => setTransactionName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={new Date(date).toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="type">Transaction Type:</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={Number(amount).toString()}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          />
        </div>

        {(type === 'Expense' || type === 'Transfer') && (
          <div>
            <label htmlFor="fromAccount">From Account:</label>
            <input
              type="text"
              id="fromAccount"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
            />
          </div>
        )}

        {(type === 'Income' || type === 'Transfer') && (
          <div>
            <label htmlFor="toAccount">To Account:</label>
            <input
              type="text"
              id="toAccount"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
            />
          </div>
        )}

        <div>
          <label htmlFor="description">Description (optional):</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className='glassjar__transaction-form__check-group'>
          <label htmlFor="isRecurring">Is Recurring:</label>
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
        </div>

        {isRecurring && (
          <>
            <div>
              <label htmlFor="endDate">End Date (optional):</label>
              <input
                type="date"
                id="endDate"
                value={endDate ? new Date(endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="recurrenceFrequency">Recurrence Frequency:</label>
              <select
                id="recurrenceFrequency"
                value={recurrenceFrequency}
                // Add the type for the event in the onChange handler
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setRecurrenceFrequency(
                    e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly'
                  )
                }
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </>
        )}

        <button type="submit">Submit</button>
        <button onClick={onClose}>Close</button>
      </form>
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
    </div>
  );
};

export default TransactionForm;

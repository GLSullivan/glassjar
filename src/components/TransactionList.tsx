import React from 'react';
import { Transaction } from '../models/Transaction';

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <div>
      <h3>Transactions</h3>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.id}>
            {/* Add transaction details here */}
          </li>
        ))}
      </ul>
    </div>
  );
};

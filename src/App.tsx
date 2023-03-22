import React, { useState } from 'react';
import { AccountList } from './components/AccountList';
import  Calendar from './components/Calendar';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { ProjectedBalances } from './components/ProjectedBalances';
import { AppContextProvider, useAppContext } from './contexts/AppContext';
import { Account } from './models/Account'
import { Transaction } from './models/Transaction';


const AppContent: React.FC = () => {
  const { accounts, transactions, addTransaction } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredTransactions = transactions.filter(
    (transaction) => transaction.date === selectedDate
  );
  
  const calculateProjectedBalances = (
    accounts: Account[],
    transactions: Transaction[],
    date: string
  ): Account[] => {
    const projectedAccounts = accounts.map((account) => ({ ...account }));
  
    transactions.forEach((transaction) => {
      if (transaction.date <= date) {
        const accountIndex = projectedAccounts.findIndex((account) => account.id === transaction.accountId);
  
        if (accountIndex !== -1) {

          const transactionAmount = (transaction.amount); // Add this line

          if (transaction.type === 'deposit') {
            projectedAccounts[accountIndex].balance += transactionAmount; // Update this line
          } else {
            projectedAccounts[accountIndex].balance -= transactionAmount; // Update this line
          }
        }
      }
    });
  
    return projectedAccounts;
  };
  
  
  const projectedAccounts = calculateProjectedBalances(accounts, transactions, selectedDate);
  
  // Add filtering and balance projection logic here

  return (
    <div>
      <AccountList accounts={accounts} />
      <TransactionForm onSubmit={addTransaction} />
      <Calendar onSelectDate={setSelectedDate} />
      <TransactionList transactions={filteredTransactions} />
      <ProjectedBalances accounts={projectedAccounts} date={selectedDate} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
};

export default App;

import React, { useState }                      from 'react';
import { AccountList }                          from './components/AccountList';
import Calendar                                 from './components/Calendar';
import TransactionForm                          from './components/forms/TransactionForm';
import { TransactionList }                      from './components/TransactionList';
import { ProjectedBalances }                    from './components/ProjectedBalances';
// import { AppContextProvider, useAppContext }    from './contexts/AppContext';
import { Account }                              from './models/Account'
import { Transaction }                          from './models/Transaction';
import Modal                                    from './components/Modal';


const AppContent: React.FC = () => {
  // const { accounts, transactions, addTransaction } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactionForm, setTransactionForm] = useState(false);
  // const filteredTransactions = transactions.filter(
  //   (transaction) => transaction.date === selectedDate
  // );

  const dateSelected = () => {

  }
  
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
  
  
  // const projectedAccounts = calculateProjectedBalances(accounts, transactions, selectedDate);
  
  // Add filtering and balance projection logic here

  return (
    <div className='glassjar__root'>
      <AccountList />
      {transactionForm && <TransactionForm onClose={() => setTransactionForm(false)} />}
      <Calendar />
      <TransactionList/>
      {/* <ProjectedBalances accounts={projectedAccounts} date={selectedDate} /> */}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Modal />
      <AppContent />
    </>
  );
};

export default App;

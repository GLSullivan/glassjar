import React, { useEffect, useState }           from 'react';
import { AccountList }                          from './components/AccountList';
import Calendar                                 from './components/Calendar';
import { TransactionList }                      from './components/TransactionList';
import { ProjectedBalances }                    from './components/ProjectedBalances';
import Modal                                    from './components/Modal';
import TransactionForm                          from './components/forms/TransactionForm';
import { Account }                              from './models/Account'
import { Transaction }                          from './models/Transaction';
import { useSelector, useDispatch }             from 'react-redux';
import { RootState }                            from './redux/store';        
import { closeTransactionModal }                from './redux/slices/modals'
import { recalculateProjections }               from './redux/slices/projections';

const AppContent: React.FC = () => {
  const transactionOpen = useSelector((state: RootState) => state.modalState.transactionFormOpen)
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate)
  const farDate = useSelector((state: RootState) => state.activeDates.farDate);
  const transactions = useSelector((state: RootState) => state.transactions.transactions);

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(recalculateProjections({ transactions, farDate }));
  }, [transactions, farDate, dispatch]);

    const closeTheModal = () => {
    dispatch(closeTransactionModal())
  }

  // const calculateProjectedBalances = (
  //   accounts: Account[],
  //   transactions: Transaction[],
  //   date: string
  // ): Account[] => {
  //   const projectedAccounts = accounts.map((account) => ({ ...account }));
  
  //   transactions.forEach((transaction) => {
  //     if (transaction.date <= date) {
  //       const accountIndex = projectedAccounts.findIndex((account) => account.id === transaction.accountId);
  
  //       if (accountIndex !== -1) {

  //         const transactionAmount = (transaction.amount); // Add this line

  //         if (transaction.type === 'deposit') {
  //           projectedAccounts[accountIndex].balance += transactionAmount; // Update this line
  //         } else {
  //           projectedAccounts[accountIndex].balance -= transactionAmount; // Update this line
  //         }
  //       }
  //     }
  //   });
  
  //   return projectedAccounts;
  // };
  
  // const projectedAccounts = calculateProjectedBalances(accounts, transactions, selectedDate);
  
  // Add filtering and balance projection logic here

  return (
    <div className='glassjar__root'>
      <Modal isOpen={transactionOpen} onClose={closeTheModal}>
        <TransactionForm initialDate={ activeDate } onClose={closeTheModal}/>
      </Modal>
      <AccountList />
      <Calendar />
      <TransactionList/>
      {/* <ProjectedBalances accounts={projectedAccounts} date={selectedDate} /> */}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppContent />
  );
};

export default App;

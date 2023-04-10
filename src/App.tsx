import { useSelector, useDispatch }                     from 'react-redux';
import React, { useEffect, useState }                   from 'react';

import { RootState }                                    from './redux/store';        
import { AccountList }                                  from './components/AccountList';
import Calendar                                         from './components/Calendar';
import { TransactionList }                              from './components/TransactionList';
import Modal                                            from './components/Modal';
import TransactionForm                                  from './components/forms/TransactionForm';
import { ProjectedBalances }                            from './components/ProjectedBalances';
import { Account }                                      from './models/Account'
import { Transaction }                                  from './models/Transaction';
import { closeTransactionModal, 
        closeAccountForm,
        closeAccountList,
        openAccountList,
        openAccountForm }                               from './redux/slices/modals'
import { recalculateProjections }                       from './redux/slices/projections';
import { AccountForm }                                  from './components/forms/AccountForm';

const AppContent: React.FC = () => {
  const transactionOpen = useSelector((state: RootState) => state.modalState.transactionFormOpen)
  const accountListOpen = useSelector((state: RootState) => state.modalState.accountListOpen)
  const accountFormOpen = useSelector((state: RootState) => state.modalState.accountFormOpen)
  const activeDate      = useSelector((state: RootState) => state.activeDates.activeDate)
  const farDate         = useSelector((state: RootState) => state.activeDates.farDate);
  const transactions    = useSelector((state: RootState) => state.transactions.transactions);

  const accounts = useSelector((state: RootState) => state.accounts.accounts);

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(recalculateProjections({ transactions, farDate }));
  }, [transactions, farDate, dispatch]);

  const closeTheTransactionModal = () => {
    dispatch(closeTransactionModal())
  }

  const closeTheAccountList = () => {
    dispatch(closeAccountList())
  }

  const closeTheAccountForm = () => {
    dispatch(closeAccountForm())
  }

  if (accounts.length < 1) {
    dispatch(openAccountForm()); //Half-assed initial setup. 
  }

  return (
    <div className="glassjar__root">
      <Modal isOpen={accountListOpen} onClose={closeTheAccountList}>
        <AccountList />
      </Modal>
      <Modal isOpen={accountFormOpen} onClose={closeTheAccountForm} hideClose={accounts.length < 1}>
        {accounts.length < 1 && <h3>Let's setup your first account.</h3>}
        <AccountForm />
      </Modal>
      <Modal isOpen={transactionOpen} onClose={closeTheTransactionModal}>
        <TransactionForm
          initialDate={activeDate}
          onClose={closeTheTransactionModal}
        />
      </Modal>
      <button
        onClick={() => {
          dispatch(openAccountList());
        }}
      >
        Accounts
      </button> 
      <Calendar />
      <TransactionList />
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

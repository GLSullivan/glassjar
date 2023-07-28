import { useSelector, useDispatch }         from 'react-redux';
import React, { useEffect }                 from 'react';

import TransactionHelper                    from './components/helpers/TransactionHelper';
import TransactionForm                      from './components/forms/TransactionForm';
import { AccountList }                      from './components/panels/AccountPanel';
import { AccountForm }                      from './components/forms/AccountForm';
import TransactionList                      from './components/TransactionList';
import CategoryGraph                        from './components/CategoryGraph'
import SettingsPanel                        from './components/SettingsPanel';
import OutlookGraph                         from './components/OutlookGraph'
import PrimaryNav                           from './components/PrimaryNav';
import Calendar                             from './components/Calendar';
import Loader                               from './components/Loader';
import Modal                                from './components/Modal';

import { recalculateProjections }           from './redux/slices/projections';
import {      
  closeTransactionModal,      
  closeAccountForm,     
  closeTransactionHelper      
}                                           from './redux/slices/modals';
import Landing                              from './components/Landing';
import { RootState }                        from './redux/store';

import './css/Main.css'      
import './css/Nav.css'  

const App: React.FC = () => {

  const transactionHelperOpen = useSelector((state: RootState) => state.modalState.transactionHelperOpen);
  const transactionOpen       = useSelector((state: RootState) => state.modalState.transactionFormOpen);
  const accountFormOpen       = useSelector((state: RootState) => state.modalState.accountFormOpen);
  const transactions          = useSelector((state: RootState) => state.transactions.transactions);
  const activeDate            = useSelector((state: RootState) => state.activeDates.activeDate);
  const farDate               = useSelector((state: RootState) => state.activeDates.farDate);
  const accounts              = useSelector((state: RootState) => state.accounts.accounts);
  const activeView            = useSelector((state: RootState) => state.views.activeView);
  
  const dispatch = useDispatch()

  const isSignedIn = useSelector((state: RootState) => state.auth.isSignedIn);

  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  const closeTheTransactionModal = () => {
    dispatch(closeTransactionModal())
  }

  const closeTheAccountForm = () => {
    dispatch(closeAccountForm())
  }

  const closeTheTransactionHelper = () => {
    dispatch(closeTransactionHelper())
  }

  useEffect(() => {
    if (accounts.length > 0) {
      dispatch(recalculateProjections({ transactions, accounts, farDate }));
    }
  }, [transactions, accounts, farDate, dispatch]);

  return (
    <div className='glassjar__root'>
      <Loader />
      {!isSignedIn && <Landing />}
      {isSignedIn && <>

      <Modal
        isOpen={accountFormOpen}
        onClose={closeTheAccountForm}
        hideClose={accounts.length < 1}
      >
        <AccountForm />
      </Modal>

      <Modal
        isOpen={transactionHelperOpen}
        onClose={closeTheTransactionHelper}
      >
        <TransactionHelper />
      </Modal>

      <Modal isOpen={transactionOpen} onClose={closeTheTransactionModal}>
        <TransactionForm
          initialDate={activeDate}
          onClose={closeTheTransactionModal}
        />
      </Modal>

      {activeView === 'calendar' && <div className='glassjar__panel-group glassjar__panel-group--calendar'>
        <Calendar />
      </div>}
      {activeView === 'accounts' && <div className='glassjar__panel-group'>
        <AccountList />
      </div>}
      {activeView === 'outlook' && <div className='glassjar__panel-group glassjar__panel-group--graph glassjar__panel-group--no-scroll'>
        <OutlookGraph />
      </div>}
      {activeView === 'categories' && <div className='glassjar__panel-group glassjar__panel-group--graph glassjar__panel-group--no-scroll'>
        <CategoryGraph />
      </div>}
      {activeView === 'transactions' && <div className='glassjar__panel-group glassjar__panel-group--transactions'>
        <TransactionList />
      </div>}
      {activeView === 'settings' && <div className='glassjar__panel-group glassjar__panel-group--settings'>
        <SettingsPanel />
      </div>
      }

      <PrimaryNav />
      
      </>}
    </div>
  );
};

export default App;

import { useSelector, useDispatch }         from 'react-redux';
import React, { useEffect }                 from 'react';

import TransactionHelper                    from './components/helpers/TransactionHelper';
import TransactionForm                      from './components/forms/TransactionForm';
import { AccountList }                      from './components/panels/AccountPanel';
import { AccountForm }                      from './components/forms/AccountForm';
import TransactionList                      from './components/TransactionList';
import CategoryGraph                        from './components/CategoryGraph'
import SettingsPanel                        from './components/SettingsPanel';
import AccountDelete                        from './components/AccountDelete';
import OutlookGraph                         from './components/OutlookGraph'
import MessageList                          from './components/MessageList';
import PrimaryNav                           from './components/PrimaryNav';
import Calendar                             from './components/Calendar';
import Landing                              from './components/Landing';
import Loader                               from './components/Loader';
import Modal                                from './components/Modal';

import { accountColors }                    from './data/AccountColors';

import { recalculateProjections }           from './redux/slices/projections';
import {      
  closeTransactionModal,      
  closeAccountForm,     
  closeTransactionHelper,
  closeDeleteTransaction      
}                                           from './redux/slices/modals';
import { RootState }                        from './redux/store';

import './css/Main.css'      
import './css/Nav.css'  
import TopNav from './components/TopNav';

const App: React.FC = () => {

  const transactionHelperOpen = useSelector((state: RootState) => state.modalState.transactionHelperOpen);
  const deleteTransactionOpen = useSelector((state: RootState) => state.modalState.deleteTransactionOpen);
  const transactionOpen       = useSelector((state: RootState) => state.modalState.transactionFormOpen);
  const accountFormOpen       = useSelector((state: RootState) => state.modalState.accountFormOpen);
  const transactions          = useSelector((state: RootState) => state.transactions.transactions);
  const activeDate            = useSelector((state: RootState) => state.activeDates.activeDate);
  const activeAccount         = useSelector((state: RootState) => state.accounts.activeAccount);
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

  const closeTheDeleteTransactionForm = () => {
    dispatch(closeDeleteTransaction())
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

      {/* TODO: https://chat.openai.com/share/53492717-90e7-4995-bdb0-3965a7c1a1ac Use portals to overhaul modals */}
      
      <Modal 
        isOpen={accountFormOpen}
        onClose={closeTheAccountForm}
        hideClose={accounts.length < 1}
        color={activeAccount ? accountColors[activeAccount.color] : undefined}
      >
        <AccountForm />
      </Modal>

      <Modal
        isOpen={transactionHelperOpen}
        onClose={closeTheTransactionHelper}
      >
        <TransactionHelper />
      </Modal>

      <Modal
        isOpen={deleteTransactionOpen}
        onClose={closeTheDeleteTransactionForm}
        color={activeAccount ? accountColors[activeAccount.color] : undefined}
      >
        <AccountDelete />
      </Modal>

      <Modal isOpen={transactionOpen} onClose={closeTheTransactionModal}>
        <TransactionForm
          initialDate={activeDate}
          onClose={closeTheTransactionModal}
        />
      </Modal>

      <div className="glassjar__main">
        <TopNav/>
            <div className='glassjar__panels'>
              <div className={`glassjar__panel-group glassjar__panel-group--calendar ${activeView === 'calendar' ? 'visible' : ''}`}>
                <Calendar />
              </div>
              <div className={`glassjar__panel-group glassjar__panel-group--accounts ${activeView === 'accounts' ? 'visible' : ''}`}>
                <AccountList />
              </div>
              <div className={`glassjar__panel-group glassjar__panel-group--outlook ${activeView === 'outlook' ? 'visible' : ''}`}>
                <OutlookGraph />
              </div>
              <div className={`glassjar__panel-group glassjar__panel-group--categories ${activeView === 'categories' ? 'visible' : ''}`}>
                <CategoryGraph />
              </div>
              <div className={`glassjar__panel-group glassjar__panel-group--transactions ${activeView === 'transactions' ? 'visible' : ''}`}>
                <TransactionList />
              </div>
              <div className={`glassjar__panel-group glassjar__panel-group--messages ${activeView === 'messages' ? 'visible' : ''}`}>
                <MessageList />
              </div>
              <div className={`glassjar__panel-group glassjar__panel-group--settings ${activeView === 'settings' ? 'visible' : ''}`}>
                <SettingsPanel />
              </div>
            </div>
      </div>
     
      <PrimaryNav />
      
      </>}
    </div>
  );
};

export default App;

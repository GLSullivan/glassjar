import { useSelector, useDispatch }                     from 'react-redux';
import React, { useEffect, useState }                   from 'react';

import TransactionHelper                                from './components/helpers/TransactionHelper';
import TransactionForm                                  from './components/forms/TransactionForm';
import { AccountList }                                  from './components/panels/AccountPanel';
import { AccountForm }                                  from './components/forms/AccountForm';
import TransactionList                                  from './components/TransactionList';
import { recalculateProjections }                       from './redux/slices/projections';
import OutlookGraph                                     from './components/OutlookGraph'
import CategoryGraph                                    from './components/CategoryGraph'
import Calendar                                         from './components/Calendar';
import { closeTransactionModal, 
  closeAccountForm,
  closeAccountList,
  openAccountForm,
  closeTransactionHelper,
  openTransactionHelper}                                from './redux/slices/modals'
import Loader                                           from './components/Loader';
import Modal                                            from './components/Modal';
import { RootState }                                    from './redux/store';        
  
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css';

import './css/Nav.css'

const AppContent: React.FC = () => {
  const transactionOpen       = useSelector((state: RootState) => state.modalState.transactionFormOpen)
  const accountListOpen       = useSelector((state: RootState) => state.modalState.accountListOpen)
  const accountFormOpen       = useSelector((state: RootState) => state.modalState.accountFormOpen)
  const transactionHelperOpen = useSelector((state: RootState) => state.modalState.transactionHelperOpen)
  const transactions          = useSelector((state: RootState) => state.transactions.transactions);
  const activeDate            = useSelector((state: RootState) => state.activeDates.activeDate)
  const farDate               = useSelector((state: RootState) => state.activeDates.farDate);
  const accounts              = useSelector((state: RootState) => state.accounts.accounts);

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(recalculateProjections({ transactions, accounts, farDate }));
  }, [transactions, accounts, farDate, dispatch]);

  let vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  const closeTheTransactionModal = () => {
    dispatch(closeTransactionModal())
  }

  const closeTheAccountList = () => {
    dispatch(closeAccountList())
  }

  const closeTheAccountForm = () => {
    dispatch(closeAccountForm())
  }


  const closeTheTransactionHelper = () => {
    dispatch(closeTransactionHelper())
  }

  if (accounts.length < 1) {
    dispatch(openAccountForm()); // Initial setup. 
  }

  function clearLocalStorage() {
    localStorage.removeItem('transactions');
    localStorage.removeItem('accounts');
  }

  const [panelState, setPanelState] = useState(0);

  return (
    <div className='glassjar__root'>
      <Loader />
      <Modal isOpen={accountListOpen} onClose={closeTheAccountList}>
        <AccountList />
      </Modal>
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
      
      {panelState === 5 && <div className='glassjar__panel-group glassjar__panel-group--calendar'>
        <Calendar />
      </div>}
      {panelState === 0 && <div className='glassjar__panel-group'>
        <TransactionList />
      </div>}
      {panelState === 1 && <div className='glassjar__panel-group'>
        <AccountList />
      </div>}
      {panelState === 2 && <div className='glassjar__panel-group glassjar__panel-group--graph glassjar__panel-group--no-scroll'>
        <OutlookGraph />
      </div>}
      {panelState === 3 && <div className='glassjar__panel-group glassjar__panel-group--graph glassjar__panel-group--no-scroll'>
        <CategoryGraph />
      </div>}
      {panelState === 4 && <div className='glassjar__panel-group'>
        <h1>Dev Tools Menu</h1>
        <h3 onClick={() => clearLocalStorage()}>
          Clear Local Storage
          {' '}
          <i className='fa-solid fa-floppy-disk-circle-xmark' />
        </h3>
        <h3 onClick={() => dispatch(openTransactionHelper())}>Run Transaction Helper</h3>
      </div>}
      <div className='glassjar__footer-nav'>
        <i onClick = {() => { setPanelState(5) }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-calendar-days' + (panelState === 5 ? ' glassjar__footer-nav__button--active' : '')} />
        <i onClick = {() => { setPanelState(0) }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-jar' + (panelState === 0 ? ' glassjar__footer-nav__button--active' : '')} />
        <i onClick = {() => { setPanelState(1) }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-file-invoice' + (panelState === 1 ? ' glassjar__footer-nav__button--active' : '')} />
        <i onClick = {() => { setPanelState(2) }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-chart-line' + (panelState === 2 ? ' glassjar__footer-nav__button--active' : '')} />
        <i onClick = {() => { setPanelState(3) }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-chart-pie' + (panelState === 3 ? ' glassjar__footer-nav__button--active' : '')} />
        <i onClick = {() => { setPanelState(4) }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-gear' + (panelState === 4 ? ' glassjar__footer-nav__button--active' : '')} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppContent />
  );
};

export default App;

import { useSelector, useDispatch }                     from 'react-redux';
import React, { useEffect, useState }                   from 'react';

import TransactionHelper                                from './components/helpers/TransactionHelper';
import TransactionForm                                  from './components/forms/TransactionForm';
import { AccountList }                                  from './components/panels/AccountPanel';
import { AccountForm }                                  from './components/forms/AccountForm';
import TransactionList                                  from './components/TransactionList';
import CategoryGraph                                    from './components/CategoryGraph'
import SettingsPanel                                    from './components/SettingsPanel';
import OutlookGraph                                     from './components/OutlookGraph'
import Calendar                                         from './components/Calendar';
import Loader                                           from './components/Loader';
import Modal                                            from './components/Modal';

import { recalculateProjections }                       from './redux/slices/projections';
import { setView }                                      from './redux/slices/views';
import { closeTransactionModal, 
  closeAccountForm,
  closeAccountList,
  openAccountForm,
  closeTransactionHelper}                               from './redux/slices/modals'
import { RootState }                                    from './redux/store';        

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
  const activeView            = useSelector((state: RootState) => state.views.activeView);

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

  const setActiveView = (view: string) => {
    dispatch(setView(view))
  }

  if (accounts.length < 1) {
    dispatch(openAccountForm()); // Initial setup. 
  }

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
      
      {activeView === "calendar" && <div className='glassjar__panel-group glassjar__panel-group--calendar'>
        <Calendar />
      </div>}
      {activeView === "accounts" && <div className='glassjar__panel-group'>
        <AccountList />
      </div>}
      {activeView === "outlook" && <div className='glassjar__panel-group glassjar__panel-group--graph glassjar__panel-group--no-scroll'>
        <OutlookGraph />
      </div>}
      {activeView === "categories" && <div className='glassjar__panel-group glassjar__panel-group--graph glassjar__panel-group--no-scroll'>
        <CategoryGraph />
      </div>}
      {activeView === "transactions" && <div className='glassjar__panel-group'>
        <TransactionList />
      </div>}
      {activeView === "settings" && <div className='glassjar__panel-group'>
        <SettingsPanel />
      </div>
      }

      <div className='glassjar__footer-nav'>
        <i onClick = {() => { setActiveView("calendar") }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-calendar-days' + (activeView === "calendar" ? ' active' : '')} />
        <i onClick = {() => { setActiveView("accounts") }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-file-invoice' + (activeView === "accounts" ? ' active' : '')} />
        <i onClick = {() => { setActiveView("outlook") }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-chart-line' + (activeView === "outlook" ? ' active' : '')} />
        <i onClick = {() => { setActiveView("categories") }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-chart-pie' + (activeView === "categories" ? ' active' : '')} />
        <i onClick = {() => { setActiveView("transactions") }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-jar' + (activeView === "transactions" ? ' active' : '')} />
        <i onClick = {() => { setActiveView("settings") }} className = {'glassjar__footer-nav__button fa-fw fa-solid fa-gear' + (activeView === "settings" ? ' active' : '')} />
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

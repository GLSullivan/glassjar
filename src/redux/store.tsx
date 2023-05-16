import { configureStore }           from '@reduxjs/toolkit';

import transactions                 from './slices/transactions';
import activeDates                  from './slices/activedates';
import projectionsReducer           from './slices/projections';
import accounts                     from './slices/accounts';
import userPrefsReducer, { UserPrefsState }             from './slices/userprefs';
import modalState                   from './slices/modals';
import loaderReducer                from './slices/loader';
import viewReducer, { ViewState }   from './slices/views';

import { Transaction }              from '../models/Transaction';
import { Account }                  from '../models/Account';

// Check if states are in local storage
const savedAccounts: Account[] | null = localStorage.getItem('accounts')
  ? JSON.parse(localStorage.getItem('accounts') as string)
  : null;

const savedTransactions: Transaction[] | null = localStorage.getItem('transactions')
  ? JSON.parse(localStorage.getItem('transactions') as string)
  : null;

let savedViews: ViewState | null = localStorage.getItem('views')
  ? JSON.parse(localStorage.getItem('views') as string)
  : null;

let savedPrefsRaw = localStorage.getItem('prefs');
console.log(savedPrefsRaw, savedPrefsRaw === 'undefined')

let savedPrefs: UserPrefsState | null;
if (savedPrefsRaw === 'undefined') {
  savedPrefs = null

} else {
  savedPrefs = savedPrefsRaw ? JSON.parse(savedPrefsRaw as string)
    : null;

}


// Preloaded state for transactions and accounts slices
const preloadedState = {
  accounts: {
    accounts     : savedAccounts || [],
    activeAccount: null,
  },
  transactions: {
    transactions     : savedTransactions || [],
    activeTransaction: null,
  },
  views: savedViews || { 
    activeView  : "calendar",
    calendarView: ""
  },
  userPrefs: savedPrefs || { 
    healthRangeTop   : 1000000,
    healthRangeBottom: 0
  },
};

console.log(preloadedState)
export const store = configureStore({
  reducer: {
    loader      : loaderReducer,
    activeDates : activeDates,
    modalState  : modalState,
    transactions: transactions,
    accounts    : accounts,
    projections : projectionsReducer,
    views       : viewReducer,
    userPrefs   : userPrefsReducer,
  },
  preloadedState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function saveStateToLocalStorage() {
  const state = store.getState();
  localStorage.setItem('accounts', JSON.stringify(state.accounts.accounts));
  localStorage.setItem('transactions', JSON.stringify(state.transactions.transactions));
  localStorage.setItem('views', JSON.stringify(state.views)); 
  localStorage.setItem('prefs', JSON.stringify(state.userPrefs)); 
}

store.subscribe(() => {
  saveStateToLocalStorage();
});

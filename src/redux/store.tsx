import { configureStore } from '@reduxjs/toolkit';
import activedates from './slices/activedates';
import modalstate from './slices/modals';
import transactions from './slices/transactions';
import accounts from './slices/accounts';
import projectionsReducer from './slices/projections';

import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

// Check if accounts data exists in localStorage
const savedAccounts: Account[] | null = localStorage.getItem('accounts')
  ? JSON.parse(localStorage.getItem('accounts') as string)
  : null;

// Check if transactions data exists in localStorage
const savedTransactions: Transaction[] | null = localStorage.getItem('transactions')
  ? JSON.parse(localStorage.getItem('transactions') as string)
  : null;

// Preloaded state for transactions and accounts slices
const preloadedState = {
  accounts: {
    accounts: savedAccounts || [],
    activeAccount: null,
  },
  transactions: {
    transactions: savedTransactions || [],
    activeTransaction: null,
  },
};

export const store = configureStore({
  reducer: {
    activeDates: activedates,
    modalState: modalstate,
    transactions: transactions,
    accounts: accounts,
    projections: projectionsReducer,
  },
  preloadedState,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function saveStateToLocalStorage() {
  const state = store.getState();

  localStorage.setItem('accounts', JSON.stringify(state.accounts.accounts));
  localStorage.setItem('transactions', JSON.stringify(state.transactions.transactions));
}

store.subscribe(() => {
  saveStateToLocalStorage();
});

export function clearLocalStorage() {
  localStorage.removeItem('accounts');
  localStorage.removeItem('transactions');
}

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Account }                    from '../../models/Account';
import { RootState }                  from '../store';

interface AccountsState {
  accounts: Account[];
  activeAccount: Account | null;
}

const initialState: AccountsState = {
  accounts: [],
  activeAccount: null,
};

const isAccountTypeLiability = (accountType: string): boolean => {
  return ['credit card', 'loan', 'mortgage'].includes(accountType);
};

export const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: { 
    setAccounts: (state, action: PayloadAction<Account[]>) => {
      state.accounts = action.payload.map(account => ({
        ...account
      }));
    },
    addAccount: (state, action: PayloadAction<Account>) => {
      const newAccount = {
        ...action.payload,
        name          : action.payload.name || 'New Account',
        currentBalance: action.payload.currentBalance || 0,
        type          : action.payload.type || 'checking',
        isLiability   : isAccountTypeLiability(action.payload.type || 'checking'),
        lastUpdated   : action.payload.lastUpdated || new Date().toISOString(),
        showInGraph   : action.payload.showInGraph || false,
        color         : action.payload.color || 0,
      };
      state.accounts.push(newAccount);
    },
    updateAccount: (state, action: PayloadAction<Account>) => {
      const index = state.accounts.findIndex(
        (account) => account.id === action.payload.id
      );
      if (index !== -1) {
        state.accounts[index] = {
          ...action.payload,
          isLiability   : isAccountTypeLiability(action.payload.type),
          lastUpdated   : action.payload.lastUpdated || new Date().toISOString(),
          showInGraph   : action.payload.showInGraph || false,
          name          : action.payload.name || 'New Account',
          currentBalance: action.payload.currentBalance || 0,
          type          : action.payload.type || 'checking',
          color         : action.payload.color || 0,
        };
      }
    },
    setActiveAccount: (state, action: PayloadAction<Account | null>) => {
      state.activeAccount = action.payload;
    },
    deleteAccount: (state, action: PayloadAction<Account>) => {
      state.accounts = state.accounts.filter(
        (account) => account.id !== action.payload.id
      );
    },
    updateSnoozedMessages: (state, action: PayloadAction<{ id: string, newSnoozedMessage: { messageType: string; date: string; } }>) => {
      const { id, newSnoozedMessage } = action.payload;
      const index = state.accounts.findIndex((account) => account.id === id);
      
      if (index !== -1) {
        if (typeof state.accounts[index].snoozedMessages === 'undefined') {
          state.accounts[index].snoozedMessages = [];
        }
        state.accounts[index].snoozedMessages!.push(newSnoozedMessage);
      }
    },
  },
});

export default accountsSlice.reducer;

export const { 
  setAccounts, 
  addAccount, 
  updateAccount, 
  setActiveAccount, 
  deleteAccount, 
  updateSnoozedMessages
} = accountsSlice.actions;
export const selectAllAccounts = (state: RootState) => state.accounts.accounts;
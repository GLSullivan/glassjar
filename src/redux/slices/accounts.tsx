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
  name: "accounts",
  initialState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
      const newAccount = {
        ...action.payload,
        isLiability: isAccountTypeLiability(action.payload.type),
      };
      state.accounts.push(newAccount);
    },    
    updateAccount: (state, action: PayloadAction<Account>) => {
      const index = state.accounts.findIndex(
        (account) => account.id === action.payload.id
      );
      if (index !== -1) {
        // Set the updatedAt property to the current timestamp
        // and update the isLiability property based on the updated account type
        state.accounts[index] = {
          ...action.payload,
          updatedAt: Date.now(),
          isLiability: isAccountTypeLiability(action.payload.type),
        };
      }
    },
    setActiveAccount: (state, action: PayloadAction<Account | null>) => {
      state.activeAccount = action.payload;
    },
    deleteAccount: (state, action: PayloadAction<string>) => {
      state.accounts = state.accounts.filter(
        (account) => account.id !== action.payload
      );
      // If the activeAccount is the one being deleted, set it to null
      if (state.activeAccount && state.activeAccount.id === action.payload) {
        state.activeAccount = null;
      }
    },
  },
});

export default accountsSlice.reducer;

export const { addAccount, updateAccount, setActiveAccount, deleteAccount } = accountsSlice.actions;
export const selectAllAccounts = (state: RootState) => state.accounts.accounts;

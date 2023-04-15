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

export const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
      state.accounts.push(action.payload);
    },
    updateAccount: (state, action: PayloadAction<Account>) => {
      const index = state.accounts.findIndex(
        (account) => account.id === action.payload.id
      );
      if (index !== -1) {
        // Set the updatedAt property to the current timestamp
        state.accounts[index] = { ...action.payload, updatedAt: Date.now() };
      }
    },
    setActiveAccount: (state, action: PayloadAction<Account | null>) => {
      state.activeAccount = action.payload;
    },
  },
});

export default accountsSlice.reducer;

export const { addAccount, updateAccount, setActiveAccount } = accountsSlice.actions;
export const selectAllAccounts = (state: RootState) => state.accounts.accounts;

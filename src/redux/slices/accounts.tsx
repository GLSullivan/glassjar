import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Account }                    from '../../models/Account';

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
        state.accounts[index] = action.payload;
      }
    },
    setActiveAccount: (state, action: PayloadAction<Account | null>) => {
      state.activeAccount = action.payload;
    },
  },
});

export const { addAccount, updateAccount, setActiveAccount } =
  accountsSlice.actions;

export default accountsSlice.reducer;

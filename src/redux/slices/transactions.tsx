import { createSlice }          from '@reduxjs/toolkit'
import type { PayloadAction }   from '@reduxjs/toolkit'
import { Transaction }          from './../../models/Transaction'

export interface Transactions {
  transactions: Transaction[];
  activeTransaction: Transaction | null;
}

const initialState: Transactions = {
  transactions: [],
  activeTransaction: null
}

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      const newTransaction = {
        ...action.payload,
        transactionName     : action.payload.transactionName || 'New Transaction',
        type                : action.payload.type || 'withdrawal',
        amount              : action.payload.amount || 0,
        date                : action.payload.date || new Date().toISOString(),
        description         : action.payload.description || '',
        isRecurring         : action.payload.isRecurring || false,
        allowOverpayment    : action.payload.allowOverpayment || true,
        showInCalendar      : action.payload.showInCalendar || true
      }
      state.transactions.push(newTransaction);
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(
        (transaction) => transaction.id === action.payload.id
      );
      if (index !== -1) {
        state.transactions[index] = { ...action.payload, updatedAt: Date.now() };
        state.transactions[index] = action.payload;
      }
    },
    bulkUpdateTransactions: (state, action: PayloadAction<Transaction[]>) => {
      action.payload.forEach((updatedTransaction) => {
        const index = state.transactions.findIndex(
          (transaction) => transaction.id === updatedTransaction.id
        );
        if (index !== -1) {
          state.transactions[index] = { ...updatedTransaction, updatedAt: Date.now() };
        }
      });
    },
    deleteTransaction: (state, action: PayloadAction<number>) => {
      state.transactions = state.transactions.filter(
        (transaction) => transaction.id !== action.payload
      );
    },    
    setActiveTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.activeTransaction = action.payload;
    },    
  },
});

export const { 
  setTransactions,
  addTransaction, 
  updateTransaction, 
  deleteTransaction,
  setActiveTransaction,
  bulkUpdateTransactions
} = transactionsSlice.actions;

export default transactionsSlice.reducer;

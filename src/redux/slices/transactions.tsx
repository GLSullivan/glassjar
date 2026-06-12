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
        start_date          : action.payload.start_date || new Date().toISOString(),
        description         : action.payload.description || '',
        isRecurring         : action.payload.isRecurring || false,
        showInCalendar      : action.payload.showInCalendar || true
      }
      state.transactions.push(newTransaction);
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(
        (transaction) => transaction.event_id === action.payload.event_id
      );
      if (index !== -1) {
        state.transactions[index] = { ...action.payload, updatedAt: Date.now() };
        state.transactions[index] = action.payload;
      }
    },
    bulkUpdateTransactions: (state, action: PayloadAction<Transaction[]>) => {
      action.payload.forEach((updatedTransaction) => {
        const index = state.transactions.findIndex(
          (transaction) => transaction.event_id === updatedTransaction.event_id
        );
        if (index !== -1) {
          state.transactions[index] = { ...updatedTransaction, updatedAt: Date.now() };
        }
      });
    },
    deleteTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(
        (transaction) => transaction.event_id !== action.payload
      );
    },
    // Pin floating occurrences so they never expire out of the discovery
    // window — they keep floating until explicitly cleared.
    recordPendingOccurrences: (
      state,
      action: PayloadAction<{ event_id: string; dates: string[] }[]>
    ) => {
      action.payload.forEach(({ event_id, dates }) => {
        const transaction = state.transactions.find((t) => t.event_id === event_id);
        if (!transaction) return;
        const pending = new Set(transaction.pendingDates ?? []);
        dates.forEach((date) => pending.add(date));
        transaction.pendingDates = Array.from(pending).sort();
        transaction.updatedAt = Date.now();
      });
    },
    // Mark floating occurrences as settled at the bank: out of pendingDates,
    // into clearedDates. Used by both swipe-to-clear and Clear All.
    clearOccurrences: (
      state,
      action: PayloadAction<{ event_id: string; dates: string[] }[]>
    ) => {
      action.payload.forEach(({ event_id, dates }) => {
        const transaction = state.transactions.find((t) => t.event_id === event_id);
        if (!transaction) return;
        const toClear = new Set(dates);
        transaction.pendingDates = (transaction.pendingDates ?? []).filter(
          (date) => !toClear.has(date)
        );
        const cleared = new Set(transaction.clearedDates ?? []);
        dates.forEach((date) => cleared.add(date));
        transaction.clearedDates = Array.from(cleared).sort();
        transaction.updatedAt = Date.now();
      });
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
  bulkUpdateTransactions,
  recordPendingOccurrences,
  clearOccurrences
} = transactionsSlice.actions;

export default transactionsSlice.reducer;

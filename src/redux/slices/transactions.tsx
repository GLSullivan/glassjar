import { createSlice }          from '@reduxjs/toolkit'
import type { PayloadAction }   from '@reduxjs/toolkit'
import { Transaction }          from './../../models/Transaction'
import { prepareTransaction }   from './../../utils/prepareTransaction'
import { expandTransactionOccurrences } from './../../utils/projectionEngine'
import { addDaysToKey, toDateKey }      from './../../utils/dateKey'

/**
 * Flipping a transaction from auto-clear to hand-clear must not turn its
 * history into "past due": those occurrences already happened and are baked
 * into the account balance. On the true/undefined -> false TRANSITION, seed
 * clearedDates with every past occurrence so only occurrences from the flip
 * forward float. A transaction CREATED with autoClear:false keeps floating
 * history — backdating an uncleared check is the feature's point.
 */
function withAutoClearTransition(previous: Transaction, prepared: Transaction): Transaction {
  if (prepared.autoClear !== false || previous.autoClear === false) return prepared;

  const yesterdayKey = addDaysToKey(toDateKey(new Date()), -1);
  const startKey = String(prepared.start_date).slice(0, 10);
  if (startKey > yesterdayKey) return prepared;

  const todayKey = toDateKey(new Date());
  const past = expandTransactionOccurrences(prepared, startKey, yesterdayKey);
  const cleared = new Set(prepared.clearedDates ?? []);
  past.forEach((date) => cleared.add(date));
  // Past pendingDates are settled too, even ones recorded under an earlier
  // schedule that no longer match the rule's occurrence dates.
  const pendingDates: string[] = [];
  for (const date of prepared.pendingDates ?? []) {
    if (date < todayKey) cleared.add(date);
    else pendingDates.push(date);
  }
  const clearedDates = Array.from(cleared).sort();
  return { ...prepared, clearedDates, pendingDates };
}

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
    // add/update/bulkUpdate all pass through prepareTransaction: the rrule
    // envelope is regenerated from the structured fields at the moment of
    // save, so no form can persist a transaction whose recurrence metadata
    // disagrees with what the projection will actually do.
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      const newTransaction = prepareTransaction({
        ...action.payload,
        transactionName     : action.payload.transactionName || 'New Transaction',
        type                : action.payload.type || 'withdrawal',
        amount              : action.payload.amount || 0,
        start_date          : action.payload.start_date || new Date().toISOString(),
        description         : action.payload.description || '',
        isRecurring         : action.payload.isRecurring || false,
        showInCalendar      : action.payload.showInCalendar || true
      });
      state.transactions.push(newTransaction);
    },
    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(
        (transaction) => transaction.event_id === action.payload.event_id
      );
      if (index !== -1) {
        const prepared = withAutoClearTransition(
          state.transactions[index],
          prepareTransaction(action.payload)
        );
        state.transactions[index] = { ...prepared, updatedAt: Date.now() };
      }
    },
    bulkUpdateTransactions: (state, action: PayloadAction<Transaction[]>) => {
      action.payload.forEach((updatedTransaction) => {
        const index = state.transactions.findIndex(
          (transaction) => transaction.event_id === updatedTransaction.event_id
        );
        if (index !== -1) {
          const prepared = withAutoClearTransition(
            state.transactions[index],
            prepareTransaction(updatedTransaction)
          );
          state.transactions[index] = { ...prepared, updatedAt: Date.now() };
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

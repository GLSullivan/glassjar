import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../models/Transaction';
import { RootState } from './../store';

interface ProjectionsState {
  byDate: { [date: string]: Transaction[] };
  hasTransaction: { [date: string]: boolean };
}

const initialState: ProjectionsState = {
  byDate: {},
  hasTransaction: {},
};

export const projectionsSlice = createSlice({
  name: 'projections',
  initialState,
  reducers: {

    recalculateProjections: (state, action: PayloadAction<{ transactions: Transaction[]; farDate: string }>) => {
      const { transactions, farDate } = action.payload;
      const farDateObj = new Date(farDate);

      transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date);
        const transactionEndDate = transaction.isRecurring
          ? (transaction.endDate
              ? new Date(Math.min(farDateObj.getTime(), new Date(transaction.endDate).getTime()))
              : farDateObj)
          : transactionDate;

        while (transactionDate <= transactionEndDate) {
          const dateString = transactionDate.toISOString().split("T")[0];

          if (!state.byDate[dateString]) {
            state.byDate[dateString] = [];
          }

          state.byDate[dateString].push(transaction);
          state.hasTransaction[dateString] = true;

          if (transaction.isRecurring) {
            // Increase date based on recurrence interval
            switch (transaction.recurrenceFrequency) {
              case 'monthly':
                transactionDate.setMonth(transactionDate.getMonth() + 1);
                break;
              case 'weekly':
                transactionDate.setDate(transactionDate.getDate() + 7);
                break;
              case 'daily':
                transactionDate.setDate(transactionDate.getDate() + 1);
                break;
              case 'yearly':
                transactionDate.setFullYear(transactionDate.getFullYear() + 1);
                break;
              default:
                break;
            }
          } else {
            break;
          }
        }
      });
    },
  },
});

export const { recalculateProjections } = projectionsSlice.actions;

export const selectTransactionsByDate = (state: RootState, activeDate: string) => state.projections.byDate[activeDate] || [];
export const selectHasTransactionByDate = (state: RootState, date: string) => state.projections.hasTransaction[date] || false;

export default projectionsSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction }                from '../../models/Transaction';
import { Account }                    from '../../models/Account';
import { RootState }                  from './../store';

interface ProjectionsState {
  byDate: { [date: string]: Transaction[] };
  hasTransaction: { [date: string]: boolean };
}

const initialState: ProjectionsState = {
  byDate: {},
  hasTransaction: {},
};

export const projectionsSlice = createSlice({
  name: "projections",
  initialState,
  reducers: {
    recalculateProjections: (
      state,
      action: PayloadAction<{ transactions: Transaction[]; farDate: string }>
    ) => {
      const { transactions, farDate } = action.payload;
      const farDateObj = new Date(farDate);

      state.byDate = {};
      state.hasTransaction = {};

      transactions.forEach((transaction) => {
        const maxIterations: number = 1000;
        let count: number = 0;
        const transactionDate = new Date(transaction.date);
        const transactionEndDate = transaction.isRecurring
          ? transaction.endDate
            ? new Date(
                Math.min(
                  farDateObj.getTime(),
                  new Date(transaction.endDate).getTime()
                )
              )
            : farDateObj
          : transactionDate;

        while (transactionDate <= transactionEndDate && count < maxIterations) {
          count++;
          const dateString = transactionDate.toISOString().split("T")[0];
          if (!state.byDate[dateString]) {
            state.byDate[dateString] = [];
          }

          state.byDate[dateString].push(transaction);
          state.hasTransaction[dateString] = true;

          if (transaction.isRecurring) {
            // Increase date based on recurrence interval
            switch (transaction.recurrenceFrequency) {
              case "monthly":
                transactionDate.setMonth(transactionDate.getMonth() + 1);
                break;
              case "weekly":
                transactionDate.setDate(transactionDate.getDate() + 7);
                break;
              case "daily":
                transactionDate.setDate(transactionDate.getDate() + 1);
                break;
              case "yearly":
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

export const selectTransactionsByDate = (
  state: RootState,
  activeDate: string
) => state.projections.byDate[activeDate] || [];
export const selectHasTransactionByDate = (state: RootState, date: string) =>
  state.projections.hasTransaction[date] || false;

export default projectionsSlice.reducer;


export const selectBalanceByDateAndAccount = (
  state: RootState,
  account: Account
): number => {
  let balance = account.currentBalance;

  const today = new Date(state.activeDates.today);
  const activeDate = new Date(state.activeDates.activeDate);
  const maxIterations = 3650; // 5 years for now. Should be user definable.

  const days: Date[] = [today];

  let currentDay = new Date(today);
  let iterations = 0;
  while (currentDay <= activeDate && iterations < maxIterations) {
    if (
      selectHasTransactionByDate(state, currentDay.toISOString().split("T")[0])
    ) {
      state.projections.byDate[currentDay.toISOString().split("T")[0]].forEach(
        (transaction) => {
          if (transaction.fromAccount === account.id) {
            if (
              transaction.type === "withdrawal" ||
              transaction.type === "transfer"
            ) {
              balance -= transaction.amount;
            }
          } else if (transaction.toAccount === account.id) {
            if (
              transaction.type === "deposit" ||
              transaction.type === "transfer"
            ) {
              balance += transaction.amount;
            }
          }
        }
      );
    }
    currentDay.setDate(currentDay.getDate() + 1);
    iterations++;
  }

  return balance;
};

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
  activeDate: string,
  account: Account
): number => {
  let balance = account.currentBalance;

  // Loop through all the dates up to the active date
  for (const date in state.projections.byDate) {
    console.log("Starting with dates for:",account.name,date,activeDate)
    if (date <= activeDate) {
      // Loop through transactions on this date
      state.projections.byDate[date].forEach((transaction) => {
        // Check if the transaction involves the given account
        console.log("?",transaction.accountId," and account ID = ",account.id)
        if (transaction.accountId === account.id) {
          console.log("***",transaction.transactionName,transaction.type,transaction.amount)
          switch (transaction.type) {
            case "deposit":
              balance += transaction.amount;
              break;
            case "withdrawal":
            case "event":
              balance -= transaction.amount;
              break;
            case "transfer":
              if (transaction.fromAccount === account.id) {
                balance -= transaction.amount;
              } else if (transaction.toAccount === account.id) {
                balance += transaction.amount;
              }
              break;
            default:
              break;
          }
        }
      });
    } else {
      // No need to process further dates
      break;
    }
  }
console.log(activeDate,balance)
  return balance;
};

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Transaction }                from "../../models/Transaction";
import { Account }                    from "../../models/Account";
import { RootState }                  from "./../store";

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

export const calculateFutureBalances = (
  transactions: Transaction[],
  accounts: Account[],
  daysOut: number,
  activeDate: string
): {
  futureBalances: { [id: string]: number[] };
  aggregateBalances: number[];
} => {
  const futureBalances: { [accountId: string]: number[] } = {};
  const aggregateBalances: number[] = new Array(daysOut).fill(0);
  const currentDate = new Date();
  const dayInMilliseconds = 24 * 60 * 60 * 1000;

  accounts.forEach((account) => {
    futureBalances[account.id] = new Array(daysOut).fill(
      account.currentBalance
    );
  });

  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    const daysDiff = Math.floor(
      (transactionDate.getTime() - currentDate.getTime()) / dayInMilliseconds
    );

    if (daysDiff >= 0 && daysDiff < daysOut) {
      if (transaction.type === "transfer") {
        const fromAccount = accounts.find(
          (acc) => acc.id === transaction.fromAccount
        );
        const toAccount = accounts.find(
          (acc) => acc.id === transaction.toAccount
        );

        if (fromAccount && toAccount) {
          if (!transaction.allowOverpayment) {
            const amountToTransfer = Math.min(
              transaction.amount,
              futureBalances[fromAccount.id][daysDiff]
            );
            futureBalances[fromAccount.id][daysDiff] -= amountToTransfer;
            futureBalances[toAccount.id][daysDiff] += amountToTransfer;
          } else {
            futureBalances[fromAccount.id][daysDiff] -= transaction.amount;
            futureBalances[toAccount.id][daysDiff] += transaction.amount;
          }
        }
      } else {
        const account = accounts.find(
          (acc) => acc.id === transaction.accountId
        );

        if (account) {
          if (transaction.type === "deposit") {
            futureBalances[account.id][daysDiff] += transaction.amount;
          } else if (transaction.type === "withdrawal") {
            futureBalances[account.id][daysDiff] -= transaction.amount;
          }
        }
      }
    }
  });

  accounts.forEach((account) => {
    for (let i = 1; i < daysOut; i++) {
      const previousBalance = futureBalances[account.id][i - 1];
      const interestRate = account.interestRate || 0;
      const dailyInterest = 1 + interestRate / 365;

      futureBalances[account.id][i] =
        futureBalances[account.id][i - 1] * dailyInterest;
      aggregateBalances[i] += futureBalances[account.id][i];
    }
  });

  return { futureBalances, aggregateBalances };
};
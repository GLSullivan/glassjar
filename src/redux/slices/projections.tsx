import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction }                from '../../models/Transaction';
import { Account }                    from '../../models/Account';
import { RootState }                  from './../store';

interface ProjectionsState {
  byDate        : { [date: string]: Transaction[] };
  hasTransaction: { [date: string]: boolean };
}

const initialState: ProjectionsState = {
  byDate        : {},
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
      const farDateObj                = new Date(farDate);

      state.byDate         = {};
      state.hasTransaction = {};

      transactions.forEach((transaction) => {
        const maxIterations: number = 1000;
        let   count: number         = 0;
        const transactionDate       = new Date(transaction.date);
        const transactionEndDate    = transaction.isRecurring
          ? transaction.endDate
            ? new Date(
                Math.min(
                  farDateObj.getTime(),
                  new Date(transaction.endDate).getTime()
                )
              )
          :  farDateObj
          :  transactionDate;
          
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
  state     : RootState,
  activeDate: string
) => state.projections.byDate[activeDate] || [];
export const selectHasTransactionByDate = (state: RootState, date: string) =>
  state.projections.hasTransaction[date] || false;

export default projectionsSlice.reducer;









// interface BalanceData {
//   balances: { [date: string]: number };
//   minDate?: Date;
//   maxDate?: Date;
//   prevAccount?: Account;
//   prevTransactions?: Transaction[];
// }

// const memoizedBalances: { [accountId: string]: BalanceData } = {};

// const hasAccountOrTransactionsChanged = (accountId: string, account: Account, transactions: Transaction[]): boolean => {
//   const prevAccount = memoizedBalances[accountId].prevAccount;
//   const prevTransactions = memoizedBalances[accountId].prevTransactions;

//   if (!prevAccount || !prevTransactions) {
//     return true;
//   }

//   if (JSON.stringify(prevAccount) !== JSON.stringify(account) || JSON.stringify(prevTransactions) !== JSON.stringify(transactions)) {
//     return true;
//   }

//   return false;
// };






export const selectBalanceByDateAndAccount = (
  state: RootState,
  account: Account
): number => {
  const startTime = performance.now();

  let balance = account.currentBalance;

  const today = new Date(state.activeDates.today);
  const activeDate = new Date(state.activeDates.activeDate);
  const maxIterations = 109500;

  let currentDay = new Date(today);

  let dayOffset = 0;
  const daysDifference = Math.floor(
    (activeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let iterations = 0;
  const accountId = account.id;

  while (dayOffset <= daysDifference && iterations < maxIterations) {
    const transactionsForCurrentDay =
      state.projections.byDate[currentDay.toISOString().split("T")[0]] || [];

    for (const transaction of transactionsForCurrentDay) {
      console.log(
        transaction.transactionName,
        transaction.amount,
        transaction.type
      );

      if (transaction.fromAccount === accountId) {
        if (
          transaction.type === "withdrawal" ||
          transaction.type === "transfer"
        ) {
          console.log(
            transaction.amount,
            balance
          );
          balance -= transaction.amount;
        }
      } else if (transaction.toAccount === accountId) {
        if (transaction.type === "deposit" || transaction.type === "transfer") {
          console.log(
            transaction.amount,
            balance
          );
          balance += transaction.amount;
        }
      }
    }

    currentDay.setDate(currentDay.getDate() + 1);
    dayOffset++;
    iterations++;
  }

  const endTime = performance.now();
  console.log("Calc time:", (endTime - startTime).toFixed(2), "ms");

  return balance;
};





export const resetMemoizedBalance = (accountId: string): void => {
  console.log("Clearing",accountId)
  // if (memoizedBalances[accountId]) {
  //   memoizedBalances[accountId] = { balances: {} };
  // }
};







export const getBalanceArrayForDateRange = (
  state: RootState,
  account: Account,
  startDate: Date,
  endDate: Date
): number[] => {
  const balanceArray: number[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const currentBalance = selectBalanceByDateAndAccount(state, account);
    balanceArray.push(currentBalance);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return balanceArray;
};

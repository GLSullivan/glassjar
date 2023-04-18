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
        const maxIterations: number = 10000;
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
              console.log("transaction.recurrenceFrequency",transaction.recurrenceFrequency)
            switch (transaction.recurrenceFrequency) {
              case "daily": 
                transactionDate.setDate(transactionDate.getDate() + 1);
                break;
              case "weekly": 
                transactionDate.setDate(transactionDate.getDate() + 7);
                break;
              case "monthly": 
                transactionDate.setMonth(transactionDate.getMonth() + 1);
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









export const selectBalanceByDateAndAccount = (
  state: RootState,
  account: Account,
  range: boolean = false,
  startDate?: string,
  endDate?: string
): number | number[] => { 
  const startTime = performance.now();
  const accountId = account.id;

  let balance = account.currentBalance;
  let balanceArray: number[] = []; 
  balanceArray.length = 0;

  const today = new Date(state.activeDates.today);
  const maxIterations = 109500;
  
  let activeDate = new Date(state.activeDates.activeDate);
  if (range && endDate) {
    activeDate =  new Date(endDate)
  } 

  let currentDay = new Date(today);
  if (range && startDate) {
    currentDay =  new Date(startDate)
  } 
  let dayOffset = 0;
  const daysDifference = Math.floor(
    (activeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let iterations = 0;

  while (dayOffset <= daysDifference && iterations < maxIterations) {
    const transactionsForCurrentDay =
      state.projections.byDate[currentDay.toISOString().split("T")[0]] || [];
    let dayBalance = 0;
    for (const transaction of transactionsForCurrentDay) {
      if (transaction.fromAccount === accountId) {
        if (
          transaction.type === "withdrawal" ||
          transaction.type === "transfer"
        ) {
          dayBalance -= transaction.amount;
        }
      } else if (transaction.toAccount === accountId) {
        if (
          transaction.type === "deposit" || 
          transaction.type === "transfer") {
          dayBalance += transaction.amount;
        }
      }
    }
    balance += dayBalance;

    if (balanceArray.length > 0) {
      dayBalance += balanceArray[balanceArray.length - 1];
    } else {
      dayBalance += balance;
    }
    balanceArray.push(dayBalance);

    currentDay.setDate(currentDay.getDate() + 1);
    dayOffset++;
    iterations++;
  }

  console.log(balanceArray)
  const endTime = performance.now();
  console.log("Calc time:", (endTime - startTime).toFixed(2), "ms");

  if (range) {
    return balanceArray
  } else {
    return balance;
  }
};


export const resetMemoizedBalance = (accountId: string): void => {
  console.log("Clearing",accountId)
  // if (memoizedBalances[accountId]) {
  //   memoizedBalances[accountId] = { balances: {} };
  // }
};






















// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { Transaction }                from '../../models/Transaction';
// import { Account }                    from '../../models/Account';
// import { RootState }                  from './../store';

// interface ProjectionsState {
//   byDate        : { [date: string]: Transaction[] };
//   hasTransaction: { [date: string]: boolean };
//   balances      : { [accountId: string]: { [date: string]: number } };
// }

// const initialState: ProjectionsState = {
//   byDate        : {},
//   hasTransaction: {},
//   balances      : {},
// };

// export const projectionsSlice = createSlice({
//   name: "projections",
//   initialState,
//   reducers: {
//     recalculateProjections: (
//       state,
//       action: PayloadAction<{ transactions: Transaction[]; farDate: string; accounts: Account[] }>
//     ) => {
//       const { transactions, farDate, accounts } = action.payload;
//       const farDateObj                = new Date(farDate);

//       state.byDate         = {};
//       state.hasTransaction = {};
//       state.balances       = {};

//       transactions.forEach((transaction) => {
//         const maxIterations: number = 1000;
//         let count: number = 0;
//         const transactionDate = new Date(transaction.date);
//         const transactionEndDate = transaction.isRecurring
//           ? transaction.endDate
//             ? new Date(
//                 Math.min(
//                   farDateObj.getTime(),
//                   new Date(transaction.endDate).getTime()
//                 )
//               )
//             : farDateObj
//           : transactionDate;

//         while (transactionDate <= transactionEndDate && count < maxIterations) {
//           count++;
//           const dateString = transactionDate.toISOString().split("T")[0];
//           if (!state.byDate[dateString]) {
//             state.byDate[dateString] = [];
//           }

//           state.byDate[dateString].push(transaction);
//           state.hasTransaction[dateString] = true;

//           if (transaction.isRecurring) {
//             switch (transaction.recurrenceFrequency) {
//               case "daily":
//                 transactionDate.setDate(transactionDate.getDate() + 1);
//                 break;
//               case "weekly":
//                 transactionDate.setDate(transactionDate.getDate() + 7);
//                 break;
//               case "monthly":
//                 transactionDate.setMonth(transactionDate.getMonth() + 1);
//                 break;
//               case "yearly":
//                 transactionDate.setFullYear(transactionDate.getFullYear() + 1);
//                 break;
//               default:
//                 break;
//             }
//           } else {
//             break;
//           }
//         }
//       });
//       // Initialize account balances
//       accounts.forEach((account) => {
//         state.balances[account.id] = {};
//       });

//       // Calculate account balances for each day
//       for (const date in state.byDate) {
//         const transactionsForDay = state.byDate[date];
//         transactionsForDay.forEach((transaction) => {
//           const accountId: string = 
//           transaction.fromAccount === accountId
//             ? transaction.fromAccount
//             : transaction.toAccount;
//           const isWithdrawalOrTransfer =
//             transaction.type === "withdrawal" ||
//             transaction.type === "transfer";
//           const isDepositOrTransfer =
//             transaction.type === "deposit" || transaction.type === "transfer";
//           const sign =
//             (transaction.fromAccount === accountId && isWithdrawalOrTransfer) ||
//             (transaction.toAccount === accountId && isDepositOrTransfer)
//               ? 1
//               : -1;
//           state.balances[accountId][date] =
//             (state.balances[accountId][date] || 0) + sign * transaction.amount;
//         });
//       }
//     },
//   },
// });

// export const { recalculateProjections } = projectionsSlice.actions;

// export const selectTransactionsByDate = (
//   state     : RootState,
//   activeDate: string
// ) => state.projections.byDate[activeDate] || [];
// export const selectHasTransactionByDate = (state: RootState, date: string) =>
//   state.projections.hasTransaction[date] || false;

// export default projectionsSlice.reducer;

// export const selectBalanceByDateAndAccount = (
//   state: RootState,
//   account: Account,
//   range: boolean = false,
//   startDate?: string,
//   endDate?: string
// ): number | number[] => {
//   const accountId = account.id;
//   const balances = state.projections.balances[accountId];

//   if (Object.keys(balances).length) {
//     if (range) {
//       const start = startDate ? new Date(startDate) : undefined;
//       const end = endDate ? new Date(endDate) : undefined;
//       const result = [];
//       for (const date in balances) {
//         const currentDate = new Date(date);
//         if ((!start || currentDate >= start) && (!end || currentDate <= end)) {
//           result.push(balances[date]);
//         }
//       }
//       return result;
//     } else {
//       const activeDate = state.activeDates.activeDate;
//       return balances[activeDate] || account.currentBalance;
//     }
//   } else {
//     return range ? [] : account.currentBalance;
//   }
// };
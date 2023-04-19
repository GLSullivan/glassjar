import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction }                from '../../models/Transaction';
import { Account }                    from '../../models/Account';
import { RootState }                  from './../store';
import { useSelector } from 'react-redux';

interface ProjectionsState {
  transactionOnDate: { [date: string]: Transaction[] };
  dayHasTransaction: { [date: string]: boolean };

// The New Stuff. 

  balanceByDateAndAccount: { [accountId: string]: { [date: string]: number } };
}

const initialState: ProjectionsState = {
  transactionOnDate        : {},
  dayHasTransaction: {},

// The New Stuff. 

  balanceByDateAndAccount: {},
};

export const projectionsSlice = createSlice({
  name: "projections",
  initialState,
  reducers: {
    recalculateProjections: (
      state,
      action: PayloadAction<{ transactions: Transaction[]; accounts: Account[]; farDate: string }>
    ) => {

      const { transactions, accounts, farDate } = action.payload;
      const today        = (new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
      const calculateThruDate                   = new Date(farDate);
            state.transactionOnDate             = {};
            state.dayHasTransaction             = {};
            state.balanceByDateAndAccount       = {};

        transactions.forEach((transaction) => {
        const maxIterations: number = 10000;
        let   count: number         = 0;
        const transactionDate       = new Date(transaction.date);
        const transactionEndDate    = transaction.isRecurring
          ? transaction.endDate
            ? new Date(
                Math.min(
                  calculateThruDate.getTime(),
                  new Date(transaction.endDate).getTime()
                )
              )
          :  calculateThruDate
          :  transactionDate;
          
        while (transactionDate <= transactionEndDate && count < maxIterations) {

          count++;
          const dateString = transactionDate.toISOString().split("T")[0];
          if (!state.transactionOnDate[dateString]) {
            state.transactionOnDate[dateString] = [];
          }

          state.transactionOnDate[dateString].push(transaction);
          
          state.dayHasTransaction[dateString] = true;

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


      accounts.forEach((account) => {

        console.log("!", account.name)
        // const startTime = performance.now();
        const accountId = account.id;

        const maxIterations = 109500;

        let balance                = account.currentBalance;
        let balanceArray: number[] = [];
        let currentDay             = new Date(today);
        let iterations             = 0;

        while (currentDay <= calculateThruDate && iterations < maxIterations) {
          const transactionsForCurrentDay =
            state.transactionOnDate[currentDay.toISOString().split("T")[0]] || [];
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

          const dateKey = currentDay.toISOString().split("T")[0];

          if (!state.balanceByDateAndAccount[accountId]) {
            state.balanceByDateAndAccount[accountId] = {};
          }
      
          state.balanceByDateAndAccount[accountId][dateKey] = dayBalance;
      


          balanceArray.push(dayBalance);
      
          currentDay.setDate(currentDay.getDate() + 1);
          iterations++;
        }
      
      })
      console.log("><><><><",state.balanceByDateAndAccount)
    },
  },
});


export const { recalculateProjections } = projectionsSlice.actions;

export const getTransactionsByDate = (
  state     : RootState,
  activeDate: string
) => state.projections.transactionOnDate[activeDate] || [];

export const dateHasTransactions = (state: RootState, date: string) =>
  state.projections.dayHasTransaction[date] || false;

export const accountBalanceOnDate = (state: RootState, accountID: string, date: string) => {
  date = new Date(date).toISOString().split("T")[0];
  console.log(date);
return state.projections.balanceByDateAndAccount[accountID][date] || 0;}

export default projectionsSlice.reducer;


export const getBalanceByDateAndAccount = (
  state: RootState,
  account: Account,
): number | number[] => { 
  console.log("!")
  // const startTime = performance.now();
  const accountId = account.id;
  const today = new Date(state.activeDates.today);
  const calculateTo =  new Date(state.activeDates.farDate);
  
  const maxIterations = 109500;

  let balance = account.currentBalance;
  let balanceArray: number[] = [];   
  let dayOffset = 0;
  let   currentDay  = new Date(today);
  let iterations = 0;

  while (currentDay <= calculateTo && iterations < maxIterations) {
    const transactionsForCurrentDay =
      state.projections.transactionOnDate[currentDay.toISOString().split("T")[0]] || [];
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
    iterations++;
  }

  return balanceArray

};


export const resetMemoizedBalance = (accountId: string): void => {
  console.log("Clearing",accountId)
  // if (memoizedBalances[accountId]) {
  //   memoizedBalances[accountId] = { balances: {} };
  // }
};

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction }                from './../../models/Transaction';
import { Account }                    from './../../models/Account';
import { RootState }                  from './../store';

interface ProjectionsState {
  transactionOnDate      : { [date: string]: Transaction[] };
  dayHasTransaction      : { [date: string]: boolean };
  balanceByDateAndAccount: { [accountId: string]: { [date: string]: number } };
}

const initialState: ProjectionsState = {
  transactionOnDate      : {},
  dayHasTransaction      : {},
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
      console.log("Recalculating Projections")
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
        console.log("!", account.name);
        const accountId = account.id;
      
        const maxIterations = 109500;
      
        let balance = account.currentBalance;
        let balanceArray: number[] = [];
        let currentDay = new Date(today);
        let iterations = 0;
      
        // Helper function to calculate interest based on account type and interest rate
        const calculateInterest = (accountType: string, interestRate: number | undefined, balance: number) => {
          let interest = 0;
          if (interestRate) {
            if (accountType === "credit card") {
              // Calculate interest for credit card (assuming daily compounding)
              interest = balance * ((interestRate * .01) / 365);
            } else if (accountType === "mortgage") {
              // Calculate interest for mortgage (assuming monthly compounding)
              if (currentDay.getDate() === 1) {
                interest = balance * ((interestRate * .01) / 12);
              }
            } else if (accountType === "savings") {
              // Calculate interest for savings account (assuming daily compounding)
              interest = balance * ((interestRate * .01) / 365);
            }else if (accountType === "loan") {
              // Calculate interest for loan account (assuming daily compounding)
              interest = balance * ((interestRate * .01) / 365);
            }
          }
          console.log("interest",interest)
          return interest;
        };
      
        while (currentDay <= calculateThruDate && iterations < maxIterations) {
          const transactionsForCurrentDay =
            state.transactionOnDate[currentDay.toISOString().split("T")[0]] || [];
          let dayBalance = 0;
      
          // Calculate interest for the current day's balance
          const interest = calculateInterest(account.type, account.interestRate, account.currentBalance);
          console.log("??????? ",interest)
          dayBalance += interest;
      
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
      });
      
      console.log("><><><><",state.balanceByDateAndAccount)
    },
  },
});

// Update the projections due to a change
export const { recalculateProjections } = projectionsSlice.actions;

// Get transactions by date
export const getTransactionsByDate = (state: RootState, activeDate: string) => {
  return state.projections.transactionOnDate[activeDate] || [];
};

// Check if a date has transactions
export const dateHasTransactions = (state: RootState, date: string) => {
  return state.projections.dayHasTransaction[date] || false;
};

  // Get account balance on a specific date
export const accountBalanceOnDate = (
  state    : RootState,
  accountID: string,
  date     : string
) => {
  const balanceByDateAndAccount = state.projections.balanceByDateAndAccount || {};
  const accountBalance          = balanceByDateAndAccount[accountID] || {};

  const today          = new Date(state.activeDates.today);
  const inputDate      = new Date(date);
  const todayISOString = today.toISOString().split("T")[0];

  if (inputDate <= today) {
    date = todayISOString;
  } else {
    date = inputDate.toISOString().split("T")[0];
  }

  return accountBalance[date] || 0;
};

// Get account balances for a date range
export const accountBalancesByDateRange = (
  state: RootState,
  accountID: string,
  startDate: string,
  endDate: string
) => {
  const balanceByDateAndAccount = state.projections.balanceByDateAndAccount || {};
  const accountBalance = balanceByDateAndAccount[accountID] || {};

  const start = new Date(startDate);
  const end = new Date(endDate);
  const balances: number[] = [];

  while (start <= end) {
    const dateKey = start.toISOString().split("T")[0];
    balances.push(accountBalance[dateKey] || 0);
    start.setDate(start.getDate() + 1);
  }

  return balances;
};

export default projectionsSlice.reducer;
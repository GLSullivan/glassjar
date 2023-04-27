import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Transaction } from "./../../models/Transaction";
import { Account } from "./../../models/Account";
import { RootState } from "./../store";

interface ProjectionsState {
  transactionsOnDate: { [date: string]: Transaction[] };
  balanceByDateAndAccount: { [accountId: string]: { [date: string]: number } };
}

const initialState: ProjectionsState = {
  transactionsOnDate: {},
  balanceByDateAndAccount: {},
};

const maxIterations: number = 100000;

export const projectionsSlice = createSlice({
  name: "projections",
  initialState,
  reducers: {
    recalculateProjections: (
      state,
      action: PayloadAction<{
        transactions: Transaction[];
        accounts: Account[];
        farDate: string;
      }>
    ) => {
      const startTime = performance.now();
      const { transactions, accounts, farDate } = action.payload;

      const today = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const calculateThruDate = new Date(
        new Date(farDate).setHours(0, 0, 0, 0)
      );

      state.transactionsOnDate = {};
      state.balanceByDateAndAccount = {};

      let tempTransactionsOnDate: { [date: string]: Transaction[] } = {};
      let tempBalanceByDateAndAccount: { [accountId: string]: { [date: string]: number } } = {};


      accounts.forEach((account) => {
        const currentDay = new Date(new Date(today).setHours(0, 0, 0, 0));
        const dateKey = currentDay.toISOString().split("T")[0];

        if (!tempBalanceByDateAndAccount[account.id]) {
          tempBalanceByDateAndAccount[account.id] = {};
        }
        tempBalanceByDateAndAccount[account.id][dateKey] = account.currentBalance;
      })
      
      // Populate the arrays for transactionsOnDay and dayHasTransaction;
      const populateTransactionsOnDate = () => {
        transactions.forEach((transaction) => {
          let count: number = 0;
          const transactionDate = new Date(transaction.date);
          const transactionEndDate = transaction.isRecurring
            ? transaction.endDate
              ? new Date(
                Math.min(
                  calculateThruDate.getTime(),
                  new Date(transaction.endDate).getTime()
                )
              )
              : calculateThruDate
            : transactionDate;

          while (
            transactionDate <= transactionEndDate &&
            count < maxIterations
          ) {
            count++;
            const dateString = transactionDate.toISOString().split("T")[0];
            if (!tempTransactionsOnDate[dateString]) {
              tempTransactionsOnDate[dateString] = [];
            }

            tempTransactionsOnDate[dateString].push(transaction);

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
                  transactionDate.setFullYear(
                    transactionDate.getFullYear() + 1
                  );
                  break;
                default:
                  break;
              }
            } else {
              break;
            }
          }
        });
      };

      // Calculate interest for the current day's balance
      function runTodaysInterest(dateKey: string) {

        // Calculate interest
        const calculateInterest = (
          accountType: string,
          interestRate: number | undefined,
          balance: number
        ) => {
          let interest = 0;
          if (interestRate) {
            if (accountType === "credit card" || "loan" || "savings") {
              // Calculate interest on daily compounding accounts.
              interest = balance * ((interestRate * 0.01) / 365);
            } else if (accountType === "mortgage") {
              // Calculate interest for mortgage (monthly compounding)
              interest = balance * ((interestRate * 0.01) / 12);
            }
          }
          return interest;
        };

        // If the account is a mortgage, is interest due today
        function isMortgageDue(account: Account, currentDay: Date) {
          if (account.type !== "mortgage") return false;

          const currentDayDate = currentDay.getDate();
          const dueDateObj = account.dueDate
            ? new Date(account.dueDate)
            : undefined;
          const daysInCurrentMonth = new Date(
            currentDay.getFullYear(),
            currentDay.getMonth() + 1,
            0
          ).getDate();

          return (
            (!account.dueDate && currentDayDate === 1) ||
            (dueDateObj && dueDateObj.getDate() === currentDayDate) ||
            (dueDateObj &&
              dueDateObj.getDate() > daysInCurrentMonth &&
              currentDayDate === daysInCurrentMonth)
          );
        }

        accounts.forEach((account) => {
          const accountId = account.id;
          let activeBalance = tempBalanceByDateAndAccount[accountId][dateKey];
          
          if (
            activeBalance > 0 &&
            (account.type === "savings" ||
              account.type === "credit card" ||
              account.type === "loan" ||
              isMortgageDue(account, currentDay))
          ) {
            const interest = calculateInterest(
              account.type,
              account.interestRate,
              activeBalance
            );
            
            let total = activeBalance + interest
            tempBalanceByDateAndAccount[accountId][dateKey] = total;
          }
        });
      }

      interface TransactionData {
        amount: number;
      }
      
      interface AccountData {
        id: string | number;
        isLiability: boolean;
      }
      
      interface BalanceData {
        [accountId: string]: { [dateKey: string]: number };
      }

      function handleTransfer(  
        tempBalanceByDateAndAccount: BalanceData,
        transaction: TransactionData,
        dateKey: string | number,
        toAccount?: AccountData,
        fromAccount?: AccountData
        ) {
          if (!toAccount || !fromAccount) return;

        let toAccountBalance = tempBalanceByDateAndAccount[toAccount.id][dateKey];
        let transferAmount = Math.min(transaction.amount, toAccountBalance);
      
        const toAccountSign = toAccount.isLiability ? -1 : 1;
        const fromAccountSign = fromAccount.isLiability ? 1 : -1;
        
        tempBalanceByDateAndAccount[toAccount.id][dateKey] += transferAmount * toAccountSign;
        tempBalanceByDateAndAccount[fromAccount.id][dateKey] += transferAmount * fromAccountSign;
        
      }
      
      function handleWithdrawal(
        tempBalanceByDateAndAccount: BalanceData,
        transaction: TransactionData,
        dateKey: string | number,
        toAccount?: AccountData,
        fromAccount?: AccountData
       ) {
        if (!fromAccount) return;

        if (fromAccount.isLiability) {
          tempBalanceByDateAndAccount[fromAccount.id][dateKey] += transaction.amount;
        } else {
          tempBalanceByDateAndAccount[fromAccount.id][dateKey] -= transaction.amount;
        }
      }
      
      function handleDeposit(  
        tempBalanceByDateAndAccount: BalanceData,
        transaction: TransactionData,
        dateKey: string | number,
        toAccount?: AccountData,
        fromAccount?: AccountData
       ) {
        if (!toAccount) return;
        if (toAccount.isLiability) {
          tempBalanceByDateAndAccount[toAccount.id][dateKey] -= transaction.amount;
        } else {
          tempBalanceByDateAndAccount[toAccount.id][dateKey] += transaction.amount;
        }
      }

      const TRANSACTION_TYPES = {
        TRANSFER: "transfer",
        WITHDRAWAL: "withdrawal",
        DEPOSIT: "deposit",
      };

      const transactionTypeHandlers = {
        [TRANSACTION_TYPES.TRANSFER]: handleTransfer,
        [TRANSACTION_TYPES.WITHDRAWAL]: handleWithdrawal,
        [TRANSACTION_TYPES.DEPOSIT]: handleDeposit,
      };

      populateTransactionsOnDate();

      let   currentDay    = new Date(new Date(today).setHours(0, 0, 0, 0));
      let   iterations    = 0;

      while (currentDay <= calculateThruDate && iterations < maxIterations) {

        const dateKey = currentDay.toISOString().split("T")[0];

        var tempDate = new Date(dateKey);
        tempDate.setDate(tempDate.getDate() - 1);
        const prevDateKey = tempDate.toISOString().split("T")[0];

        // Set start balance for each account on this date
        accounts.forEach((account) => {
          tempBalanceByDateAndAccount[account.id][dateKey] = (tempBalanceByDateAndAccount[account.id][prevDateKey] !== undefined) ? tempBalanceByDateAndAccount[account.id][prevDateKey] : account.currentBalance;
        })
        
        // Get a list of transactions on today's date
        const transactionsForCurrentDay = tempTransactionsOnDate[currentDay.toISOString().split("T")[0]] || [];

        for (const transaction of transactionsForCurrentDay) {
          let toAccount = accounts.find(account => account.id === transaction.toAccount);
          let fromAccount = accounts.find(account => account.id === transaction.fromAccount);
        
          const handler = transactionTypeHandlers[transaction.type];
          if (handler) {
            handler(tempBalanceByDateAndAccount, transaction, dateKey, toAccount, fromAccount);
          }
        }
        

        runTodaysInterest(dateKey);

        currentDay.setDate(currentDay.getDate() + 1);
        iterations++;
      }

      state.transactionsOnDate = tempTransactionsOnDate;
      state.balanceByDateAndAccount = tempBalanceByDateAndAccount;

      const endTime = performance.now();
      console.log(`Recalculating Projections took ${(endTime - startTime).toFixed(2)} milliseconds to execute.`);

    },
  },
});

// Update the projections due to a change
export const { recalculateProjections } = projectionsSlice.actions;

// Get transactions by date
export const getTransactionsByDate = (state: RootState, activeDate: string) => {
  return state.projections.transactionsOnDate[activeDate] || [];
};

// Check if a date has transactions
export const dateHasTransactions = (state: RootState, date: string) => {
  return state.projections.transactionsOnDate[date] !== undefined || false;
};

// Get account balance on a specific date
export const accountBalanceOnDate = (
  state: RootState,
  accountID: string,
  date: string
) => {
  const balanceByDateAndAccount =
    state.projections.balanceByDateAndAccount || {};
  const accountBalance = balanceByDateAndAccount[accountID] || {};

  const today = new Date(state.activeDates.today);
  const inputDate = new Date(date);
  const todayISOString = today.toISOString().split("T")[0];

  if (inputDate <= today) {
    date = todayISOString;
  } else {
    date = inputDate.toISOString().split("T")[0];
  }

  return accountBalance[date] || 0;
};

// Get transactions in range.
export const getTransactionsByRange = (
  state: RootState,
  startIndex: number,
  endIndex: number
) => {
  const allTransactions: { transaction: Transaction; date: string }[] = [];

  // Flatten the transactionsOnDate object into a single array
  Object.entries(state.projections.transactionsOnDate).forEach(
    ([date, transactions]) => {
      transactions.forEach((transaction) => {
        allTransactions.push({ transaction, date });
      });
    }
  );

  // Sort transactions by date
  allTransactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Return the transactions within the specified range
  return allTransactions.slice(startIndex, endIndex);
};

// Get account balances for a date range
export const accountBalancesByDateRange = (
  state: RootState,
  accountID: string,
  startDate: string,
  endDate: string
) => {
  const balanceByDateAndAccount =
    state.projections.balanceByDateAndAccount || {};
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

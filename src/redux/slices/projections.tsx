import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Transaction }                from "./../../models/Transaction";
import { Account }                    from "./../../models/Account";
import { RootState }                  from "./../store";

interface ProjectionsState {
  transactionsOnDate     : { [date: string]: Transaction[] };
  balanceByDateAndAccount: { [accountId: string]: { [date: string]: number } };
  categorySpend          : { [category: string]: number };
}

const initialState: ProjectionsState = {
  transactionsOnDate     : {},
  balanceByDateAndAccount: {},
  categorySpend          : {}
};

let allAccounts: Account[];

const maxIterations: number = 1000;

export const projectionsSlice = createSlice({
  name: "projections",
  initialState,
  reducers: {
    recalculateProjections: (
      state,
      action: PayloadAction<{
        transactions: Transaction[];
        accounts    : Account[];
        farDate     : string;
      }>
    ) => {
      const startTime = performance.now();
      const { transactions, accounts, farDate } = action.payload;
      const today                               = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const calculateThruDate                   = new Date(
        new Date(farDate).setHours(0, 0, 0, 0)
      );
      
      allAccounts                   = accounts;
      state.transactionsOnDate      = {};
      state.balanceByDateAndAccount = {};
      state.categorySpend           = {};

      let tempTransactionsOnDate      : { [date: string]: Transaction[] }                   = {};
      let tempBalanceByDateAndAccount : { [accountId: string]: { [date: string]: number } } = {};
      let tempCategorySpend           : { [category: string]: number }                      = {};

      accounts.forEach((account) => {
        const currentDay = new Date(new Date(today).setHours(0, 0, 0, 0));
        const dateKey = currentDay.toISOString().split("T")[0];

        if (!tempBalanceByDateAndAccount[account.id]) {
          tempBalanceByDateAndAccount[account.id] = {};
        }
        tempBalanceByDateAndAccount[account.id][dateKey] = account.currentBalance;
      });

      // Populate the arrays for transactionsOnDay and dayHasTransaction;
      const populateTransactionsOnDate = () => {
        transactions.forEach((transaction) => {
          let count: number = 0;
          const transactionDate    = new Date(transaction.date);
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
            transactionDate <= transactionEndDate && count < maxIterations
          ) {
            count++;
            const dateString = transactionDate.toISOString().split("T")[0];
            if (!tempTransactionsOnDate[dateString]) {
              tempTransactionsOnDate[dateString] = [];
            }
      
            tempTransactionsOnDate[dateString].push(transaction);
      
            if (transaction.isRecurring) {
      
              let caseFound = false; // Add a flag to check if a switch case was met
      
              // Increase date based on recurrence interval
              switch (transaction.recurrenceFrequency) {
                case "daily":
                  transactionDate.setDate(transactionDate.getDate() + 1);
                  caseFound = true;
                  break;
                case "weekly":
                  transactionDate.setDate(transactionDate.getDate() + 7);
                  caseFound = true;
                  break;
                case "monthly":
                  transactionDate.setMonth(transactionDate.getMonth() + 1);
                  caseFound = true;
                  break;
                case "yearly":
                  transactionDate.setFullYear(
                    transactionDate.getFullYear() + 1
                  );
                  caseFound = true;
                  break;
                case "given days":
                  if (transaction.givenDays && transaction.givenDays.length > 0) {
                    const currentDayOfWeek = transactionDate.getDay();
                    let   closestDayOfWeek = null;
                    let   minDaysUntilNext = Infinity;
                
                    for (const dayOfWeek of transaction.givenDays) {
                      const daysUntilNext = (dayOfWeek - currentDayOfWeek + 7) % 7 || 7;
                      if (daysUntilNext < minDaysUntilNext) {
                        minDaysUntilNext = daysUntilNext;
                        closestDayOfWeek = dayOfWeek;
                      }
                    }
                
                    if (closestDayOfWeek !== null) {
                      transactionDate.setDate(transactionDate.getDate() + minDaysUntilNext);
                      caseFound = true;
                    }
                  }
                  break;
                case "twice monthly":
                  const initialDate = new Date(transaction.date).getDate();

                  const currentDay = transactionDate.getDate();
                  const currentMonth = transactionDate.getMonth();
                  const currentYear = transactionDate.getFullYear();
                  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

                  const daysAway = Math.abs(currentDay - initialDate);

                  if (currentDay < 15) {
                    transactionDate.setDate(currentDay + 14);
                  } else {
                    transactionDate.setDate(currentDay - 14);
                    transactionDate.setMonth(currentMonth + 1);
                  }

                  if (daysAway > 10 && daysAway < 18) {
                    if (transactionDate.getDate() < initialDate) {
                      transactionDate.setMonth(currentMonth);
                      transactionDate.setFullYear(currentYear);
                      if (initialDate > daysInCurrentMonth) {
                        transactionDate.setDate(daysInCurrentMonth);
                      } else {
                        transactionDate.setDate(initialDate);
                      }
                    }
                  }
                  caseFound = true;
                  break;
                case "custom":
                  if (transaction.recurrenceInterval) {
                    switch (transaction.customIntervalType) {
                      case "day":
                        transactionDate.setDate(transactionDate.getDate() + transaction.recurrenceInterval);
                        caseFound = true;
                        break;
                      case "week":
                        transactionDate.setDate(transactionDate.getDate() + transaction.recurrenceInterval * 7);
                        caseFound = true;
                        break;
                      case "month":
                        transactionDate.setMonth(transactionDate.getMonth() + transaction.recurrenceInterval);
                        caseFound = true;
                        break;
                      case "year":
                        transactionDate.setFullYear(transactionDate.getFullYear() + transaction.recurrenceInterval);
                        caseFound = true;
                        break;
                      default:
                        break;
                    }
                  }
                  break;
                default:
                  break;
              }
      
              if (!caseFound) {
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
          accountType : string,
          interestRate: number | undefined,
          balance     : number
        ) => {
          let interest = 0;
          if (interestRate) {
            // eslint-disable-next-line eqeqeq
            if (accountType == "credit card" || accountType == "loan" || accountType == "savings") {
              // Calculate interest on daily compounding accounts.
              interest = balance * ((interestRate * 0.01) / 365);
            // eslint-disable-next-line eqeqeq
            } else if (accountType == "mortgage") {
              // Calculate interest for mortgage (monthly compounding)
              const annualInterestRateDecimal = interestRate / 100;
              const monthlyInterestRate       = annualInterestRateDecimal / 12;
                    interest                  = interest = monthlyInterestRate * balance;
            }
          }
          return Math.round(interest);
        };

        // If the account is a mortgage, is interest due today
        function isMortgageDue(account: Account, currentDay: Date): boolean {
          if (account.type !== 'mortgage') return false;
        
          const currentDayDate = currentDay.getUTCDate();
          const daysInMonth    = new Date(currentDay.getUTCFullYear(), currentDay.getUTCMonth() + 1, 0).getUTCDate();

          if (account.dueDate) {
            const dateDue = new Date(account.dueDate).getUTCDate();
            return dateDue === currentDayDate || (daysInMonth < dateDue && currentDayDate === daysInMonth);
          } else {
            return currentDayDate === 1;
          }
        }

        accounts.forEach((account) => {
          const accountId = account.id;
          let activeBalance = tempBalanceByDateAndAccount[accountId][dateKey];

          if (
            activeBalance > 0 &&
            (account.type  === "savings" ||
              account.type === "credit card" ||
              account.type === "loan" ||
              isMortgageDue(account, currentDay))
          ) {
            const interest = calculateInterest(
              account.type,
              account.interestRate,
              activeBalance
            );
            let total = activeBalance + interest;
            tempBalanceByDateAndAccount[accountId][dateKey] = total;
          }
        });
      }

      interface TransactionData {
        amount: number;
      }

      interface AccountData {
        id         : string | number;
        isLiability: boolean;
      }

      interface BalanceData {
        [accountId: string]: { [dateKey: string]: number };
      }

      function sumUpCategories(amount: number, category?: string) {
        if (!category) {
          category = "Uncategorized"
        }

        if (!tempCategorySpend[category]) {
          tempCategorySpend[category] = 0;
        }
        tempCategorySpend[category] += amount;
      }

      function handleTransfer(
        tempBalanceByDateAndAccount : BalanceData,
        transaction                 : TransactionData,
        dateKey                     : string | number,
        toAccount                  ?: AccountData,
        fromAccount                ?: AccountData,
        category                   ?: string,
      ) {
        if (!toAccount || !fromAccount) return;

        sumUpCategories(transaction.amount, category)

        let toAccountBalance = 
          tempBalanceByDateAndAccount[toAccount.id][dateKey];
        let transferAmount = Math.min(transaction.amount, toAccountBalance);
        const toAccountSign   = toAccount.isLiability ? -1 : 1;
        const fromAccountSign = fromAccount.isLiability ? 1 : -1;

        tempBalanceByDateAndAccount[toAccount.id][dateKey]   += transferAmount * toAccountSign;
        tempBalanceByDateAndAccount[fromAccount.id][dateKey] += transferAmount * fromAccountSign;
      }

      function handleWithdrawal(
        tempBalanceByDateAndAccount : BalanceData,
        transaction                 : TransactionData,
        dateKey                     : string | number,
        toAccount                  ?: AccountData,
        fromAccount                ?: AccountData,
        category                   ?: string,
      ) {

        if (!fromAccount) return;
          if (fromAccount.isLiability) {
            tempBalanceByDateAndAccount[fromAccount.id][dateKey] += transaction.amount;
          } else {
            tempBalanceByDateAndAccount[fromAccount.id][dateKey] -= transaction.amount;
          }

          sumUpCategories(transaction.amount, category)
        
        }

      function handleDeposit(
        tempBalanceByDateAndAccount : BalanceData,
        transaction                 : TransactionData,
        dateKey                     : string | number,
        toAccount                  ?: AccountData,
        fromAccount                ?: AccountData,
        category                   ?: string,
      ) {
        if (!toAccount) return;
        if (toAccount.isLiability) {
          tempBalanceByDateAndAccount[toAccount.id][dateKey] -=
            transaction.amount;
        } else {
          tempBalanceByDateAndAccount[toAccount.id][dateKey] +=
            transaction.amount;
        }
      }

      const TRANSACTION_TYPES = {
        TRANSFER  : "transfer",
        WITHDRAWAL: "withdrawal",
        DEPOSIT   : "deposit",
      };

      const transactionTypeHandlers = {
        [TRANSACTION_TYPES.TRANSFER]  : handleTransfer,
        [TRANSACTION_TYPES.WITHDRAWAL]: handleWithdrawal,
        [TRANSACTION_TYPES.DEPOSIT]   : handleDeposit,
      };

      populateTransactionsOnDate();

      let currentDay = new Date(new Date(today).setHours(0, 0, 0, 0));
      let iterations = 0;

      while (currentDay <= calculateThruDate && iterations < maxIterations) {
        const dateKey = currentDay.toISOString().split("T")[0];

        var tempDate = new Date(dateKey);
        tempDate.setDate(tempDate.getDate() - 1);
        const prevDateKey = tempDate.toISOString().split("T")[0];

        // Set start balance for each account on this date
        accounts.forEach((account) => {
          tempBalanceByDateAndAccount[account.id][dateKey]       = 
          tempBalanceByDateAndAccount[account.id][prevDateKey] !== undefined
              ? tempBalanceByDateAndAccount[account.id][prevDateKey]
              :  account.currentBalance;
        });

        // Get a list of transactions on today's date
        const transactionsForCurrentDay =
          tempTransactionsOnDate[currentDay.toISOString().split("T")[0]] || [];

        for (const transaction of transactionsForCurrentDay) {
          let toAccount = accounts.find(
            (account) => account.id === transaction.toAccount
          );
          let fromAccount = accounts.find(
            (account) => account.id === transaction.fromAccount
          );

          let category = transaction.category

          const handler = transactionTypeHandlers[transaction.type];
          if (handler) {
            handler(
              tempBalanceByDateAndAccount,
              transaction,
              dateKey,
              toAccount,
              fromAccount,
              category
            );
          }
        }

        runTodaysInterest(dateKey);

        currentDay.setDate(currentDay.getDate() + 1);
        iterations++;
      }

      const removeOldTransactions = () => {
        let today = new Date(new Date().setDate(new Date().getDate()-1));

        today.setHours(0, 0, 0, 0); // To compare only the date part and not the time part

        Object.keys(tempTransactionsOnDate).forEach((date) => {
          const transactionDate = new Date(date);
          if (transactionDate < today) {
            delete tempTransactionsOnDate[date];
          }
        });
      };
      removeOldTransactions();

      state.transactionsOnDate      = tempTransactionsOnDate;
      state.balanceByDateAndAccount = tempBalanceByDateAndAccount;
      state.categorySpend           = tempCategorySpend;

      const endTime = performance.now();

      console.log(
        `Recalculating Projections took ${(endTime - startTime).toFixed(
          2
        )} milliseconds to execute.`
      );
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

// Get categorized spend amounts
export const getCategorySpend = (state: RootState) => {
  return state.projections.categorySpend;
};

// Get account balance on a specific date
export const accountBalanceOnDate = (
  state: RootState,
  accountID: string,
  date: string
) => {
  const balanceByDateAndAccount = state.projections.balanceByDateAndAccount || {};
  const accountBalance          = balanceByDateAndAccount[accountID] || {};

  const today                   = new Date(state.activeDates.today);
  const todayISOString          = today.toISOString().split("T")[0];
  const inputDate               = new Date(date);

  if (inputDate <= today) {
    date = todayISOString;
  } else {
    date = inputDate.toISOString().split("T")[0];
  }

  return accountBalance[date] || 0;
};

// Get account balance on a specific date
export const aggregateBalanceOnDate = (
  state: RootState,
  date: string
) => {
  const balanceByDateAndAccount = state.projections.balanceByDateAndAccount || {};
  
  const today                   = new Date(state.activeDates.today);
  const todayISOString          = today.toISOString().split("T")[0];
  const inputDate               = new Date(date);

  if (inputDate <= today) {
    date = todayISOString;
  } else {
    date = inputDate.toISOString().split("T")[0];
  }

  let totalBalance = 0;
if (allAccounts) {
  allAccounts.forEach((account) => {
    const accountId = account.id;
    if (account && account.showInGraph) {
      if (account.isLiability) {
        totalBalance -= balanceByDateAndAccount[accountId][date] || 0;
      } else {
        totalBalance += balanceByDateAndAccount[accountId][date] || 0;
      }
    }

  })
}
  return totalBalance;
};

// Get transactions in range.
export const getTransactionsByRange = (
  state     : RootState,
  startIndex: number,
  endIndex  : number
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

// Get transactions in date range.
export const getTransactionsByDateRange = (
  state: RootState,
  startDate: string,
  endDate: string
) => {
  const groupedTransactions: {
    date: string;
    transactions: { transaction: Transaction; date: string }[];
  }[] = [];

  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    const dateString = currentDate.toISOString().split('T')[0]; // Extract the date part of the ISO string
    const transactionsOnDate = state.projections.transactionsOnDate[dateString];

    if (transactionsOnDate) {
      const transactions: { transaction: Transaction; date: string }[] = [];
      transactionsOnDate.forEach((transaction) => {
        transactions.push({ transaction, date: dateString });
      });
      groupedTransactions.push({ date: dateString, transactions });
    }

    currentDate.setDate(currentDate.getDate() + 1); // Move to the next date
  }

  return groupedTransactions;
};

// Get account balances for a date range
export const accountBalancesByDateRange = (
  state    : RootState,
  accountID: string,
  startDate: string,
  endDate  : string
) => {
  const balanceByDateAndAccount = state.projections.balanceByDateAndAccount || {};
  const accountBalance          = balanceByDateAndAccount[accountID] || {};
  const start                   = new Date(startDate);
  const end                     = new Date(endDate);
  const balances: number[]      = [];

  while (start <= end) {
    const dateKey = start.toISOString().split("T")[0];
    balances.push(accountBalance[dateKey] || 0);
    start.setDate(start.getDate() + 1);
  }
  return balances;
};

export default projectionsSlice.reducer;

import { addMonths, isBefore, isWithinInterval, addYears, parseISO, differenceInDays } from 'date-fns'; 

import { createSlice, PayloadAction }                                 from '@reduxjs/toolkit';

import { Transaction }                                                from './../../models/Transaction';
import { Account }                                                    from './../../models/Account';
import { RootState }                                                  from './../store';
import { TransactionType }                                            from './../../utils/constants';

import { RRule, RRuleSet } from 'rrule';

import { startOfDay, sub } from 'date-fns'

interface ProjectionsState {
  transactionsOnDate     : { [date: string]: Transaction[] };
  balanceByDateAndAccount: { [accountId: string]: { [date: string]: number } };
  categorySpend          : { [category: string]: number };
  accountMessages        : { [accountId: string]: { date: string, type: string, account: Account}[] };
  transactionsByAccount  : { [accountId: string]: Transaction[] };
  spendByTransaction     : { [transactionID: string]: number }
}

const initialState: ProjectionsState = {
  transactionsOnDate     : {},
  balanceByDateAndAccount: {},
  categorySpend          : {},
  accountMessages        : {},
  transactionsByAccount  : {},
  spendByTransaction     : {},
};

let allAccounts: Account[];

const maxIterations: number = 1000;

export const projectionsSlice = createSlice({
  name: 'projections',
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
      state.accountMessages         = {};

      let tempTransactionsOnDate      : { [date: string]: Transaction[] }                   = {};
      
    

      let tempBalanceByDateAndAccount : { [accountId: string]: { [date: string]: number } } = {};
      let tempCategorySpend           : { [category: string]: number }                      = {};
      let tempTransactionSpend        : { [transactionID: string]: number }                 = {};

      accounts.forEach((account) => {
        const currentDay = new Date(new Date(today).setHours(0, 0, 0, 0));
        const dateKey = currentDay.toISOString().split('T')[0];        
        if (isBefore( addMonths(parseISO(account.lastUpdated), 1), currentDay) && account.notifyOnAccountStale) {
          updateAccountMessages(account.id,dateKey,'accountStale',account);
        }

        if (!tempBalanceByDateAndAccount[account.id]) {
          tempBalanceByDateAndAccount[account.id] = {};
        }
        tempBalanceByDateAndAccount[account.id][dateKey] = account.currentBalance;
      });

      // Populate the arrays for transactionsOnDay and dayHasTransaction;
      const populateTransactionsOnDate = () => {
        const today = sub(startOfDay(new Date()), { hours: 1 });
        const farDateStartOfDay = startOfDay(new Date(farDate));

        transactions.forEach((transaction) => {

//  ___       ___          ___                       
//   |  |__| |__     |\ | |__  |  |    |  |  /\  \ / 
//   |  |  | |___    | \| |___ |/\|    |/\| /~~\  |  
//                                                   

// Assume farDate is defined somewhere

let dateArray: Date[] = [];





  // Parse the JSON string back to object
  const serializedSet = JSON.parse(transaction.rrule);
  const { rrule: rruleString, rdates } = serializedSet;

  const rruleSet = new RRuleSet();

  // Use rrulestr to create RRule object
  if (rruleString) {
    const rrule = RRule.fromString(rruleString);
    rruleSet.rrule(rrule);
  }

  // Add the custom dates back
  if (rdates.length > 0) {
    rdates.forEach((dateStr: string) => {
      rruleSet.rdate(new Date(dateStr));
    });
    // console.log(rdates,farDate)
  }

  // If there are exdates, exclude these from the recurrence
  if (transaction.exdates) {
    transaction.exdates.forEach((exdateStr: string) => {
      rruleSet.exdate(new Date(exdateStr));
    });
  }

  dateArray = rruleSet.between(today, farDateStartOfDay);
  

  // if (transaction.start_date) {
  //   // For non-recurring events, check if the start date is between 'today' and 'farDateStartOfDay'
  //   const startDate = startOfDay(new Date(transaction.start_date));  
  //   if (startDate >= today && startDate <= farDateStartOfDay) {
  //     dateArray.push(startDate);
  //   }
  // } 
  dateArray.forEach((date) => {
    const dateString = date.toISOString().split('T')[0]; // Converting Date to 'YYYY-MM-DD' string format
    if (!tempTransactionsOnDate[dateString]) {
      tempTransactionsOnDate[dateString] = [];
    }
    tempTransactionsOnDate[dateString].push(transaction); // Push the current transaction
  });  

        });

        // console.log(tempTransactionsOnDate)
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
            if (accountType == 'credit card' || accountType == 'loan' || accountType == 'savings') {
              // Calculate interest on daily compounding accounts.
              interest = balance * ((interestRate * 0.01) / 365);
            // eslint-disable-next-line eqeqeq
            } else if (accountType == 'mortgage') {
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
            (account.type  === 'savings' ||
              account.type === 'credit card' ||
              account.type === 'loan' ||
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

      interface BalanceData {
        [accountId: string]: { [dateKey: string]: number };
      }

      function sumUpCategories(amount: number, category?: string) { 
        // TODO: FUTURE FEATURE! This is where to do up the total spend per transaction over a year. 
        // TODO: When the transaction page can be sorted by category, put the per/category/per/year value beside the name.
        if (!category) {
          category = 'Uncategorized'
        }

        if (!tempCategorySpend[category]) {
          tempCategorySpend[category] = 0;
        }
        tempCategorySpend[category] += amount;
      }

      function sumUpSpend(transactionID: string, amount: number, date: string) { 

        if (!tempTransactionSpend[transactionID]) {
          tempTransactionSpend[transactionID] = 0;
        }

        if (isWithinInterval(parseISO(date), { start: new Date(), end: addYears(new Date(), 1) }))  { // Add the amount of the spend if its with in this year.
          tempTransactionSpend[transactionID] += Math.abs(amount);
        }  

      }
      
      function handleTransfer(
        tempBalanceByDateAndAccount : BalanceData,
        transaction                 : Transaction,
        dateKey                     : string,
        toAccount                  ?: Account,
        fromAccount                ?: Account,
        category                   ?: string,
      ) {
        if (!toAccount || !fromAccount) return;

        sumUpCategories(transaction.amount, category)

        let toAccountBalance = tempBalanceByDateAndAccount[toAccount.id][dateKey];
        let transferAmount   = transaction.amount;


        if (toAccount.isLiability) { 
          // TODO: THIS ISN'T ALLOWING OVERPAYMENT, and that's great, but it should check if overpayment is allowed. 
          if (transaction.amount > tempBalanceByDateAndAccount[toAccount.id][dateKey] && toAccount.notifyOnAccountPayoff && 
            (toAccount.type === 'loan' || toAccount.type === 'credit card' || toAccount.type === 'mortgage')) 
          {
            updateAccountMessages(toAccount.id,dateKey,'accountPayoff',toAccount);
          }
          // TODO: THIS IS CORRECT. Also where I need to look into allowOverPayment and adjust accordingly. 
          transferAmount = Math.min(transaction.amount, toAccountBalance);
        }
        const toAccountSign   = toAccount.isLiability ? -1 : 1;
        const fromAccountSign = fromAccount.isLiability ? 1 : -1;

        sumUpSpend(transaction.event_id, transferAmount, dateKey);
        tempBalanceByDateAndAccount[toAccount.id][dateKey]   += transferAmount * toAccountSign;
        tempBalanceByDateAndAccount[fromAccount.id][dateKey] += transferAmount * fromAccountSign;
      }

      function handleWithdrawal(
        tempBalanceByDateAndAccount : BalanceData,
        transaction                 : Transaction,
        dateKey                     : string,
        toAccount                  ?: Account,
        fromAccount                ?: Account,
        category                   ?: string,
      ) {

        if (!fromAccount) return;

        sumUpSpend(transaction.event_id, transaction.amount, dateKey);
          if (fromAccount.isLiability) {
            // TODO: THIS IS NOT RESPECTING ALLOW OVERDRAFT or any such. 
            if (fromAccount.creditLimit) {
              if (transaction.amount > fromAccount.creditLimit - tempBalanceByDateAndAccount[fromAccount.id][dateKey] && fromAccount.notifyOnAccountOverCredit && 
                (fromAccount.type === 'credit card')) 
              {
                updateAccountMessages(fromAccount.id,dateKey,'accountOverCredit',fromAccount);
              }
            }
            // TODO: THIS IS CORRECT. Also where I need to look into allowOverPayment and adjust accordingly. 
            tempBalanceByDateAndAccount[fromAccount.id][dateKey] += transaction.amount;
          } else {

            if (fromAccount) {
              if (transaction.amount > tempBalanceByDateAndAccount[fromAccount.id][dateKey] && fromAccount.notifyOnAccountOverDraft && 
                (fromAccount.type === 'checking' || fromAccount.type === 'savings' || fromAccount.type === 'cash')) 
              {
                updateAccountMessages(fromAccount.id,dateKey,'accountOverdraft',fromAccount);

              }
            }

            tempBalanceByDateAndAccount[fromAccount.id][dateKey] -= transaction.amount;
          }

          sumUpCategories(transaction.amount, category)
        
        }

      function handleDeposit(
        tempBalanceByDateAndAccount : BalanceData,
        transaction                 : Transaction,
        dateKey                     : string,
        toAccount                  ?: Account,
        fromAccount                ?: Account,
        category                   ?: string,
      ) {
        if (!toAccount) return;
        sumUpSpend(transaction.event_id, transaction.amount, dateKey);

        if (toAccount.isLiability) {
          // if (transaction.amount > tempBalanceByDateAndAccount[toAccount.id][dateKey] && toAccount.notifyOnAccountPayoff && 
          //   (toAccount.type === 'mortgage' || toAccount.type === 'loan' || toAccount.type === 'credit card')) // TODO: Gotta be a better way to do this. Maybe move this to the message panel?
          // {
          //   updateAccountMessages(toAccount.id,dateKey,'accountPayoff',toAccount);

          // }
          // THIS IS CORRECT. Also where I need to look into allowOverPayment and adjust accordingly. 
          tempBalanceByDateAndAccount[toAccount.id][dateKey] -= transaction.amount;
          
        } else {
          // console.log(">>>>>>>>>>>>>>>>>>>>>",transaction.transactionName,dateKey,transaction)
          tempBalanceByDateAndAccount[toAccount.id][dateKey] += transaction.amount;
        }
      }

      const TRANSACTION_TYPES = {
        TRANSFER  : 'transfer',
        WITHDRAWAL: 'withdrawal',
        DEPOSIT   : 'deposit',
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
        const dateKey = currentDay.toISOString().split('T')[0];

        var tempDate = new Date(dateKey);
        tempDate.setDate(tempDate.getDate() - 1);
        const prevDateKey = tempDate.toISOString().split('T')[0];

        // Set start balance for each account on this date
        accounts.forEach((account) => {
          tempBalanceByDateAndAccount[account.id][dateKey]       = 
          tempBalanceByDateAndAccount[account.id][prevDateKey] !== undefined
              ? tempBalanceByDateAndAccount[account.id][prevDateKey]
              :  account.currentBalance;
        });

        // Get a list of transactions on today's date
        const transactionsForCurrentDay =
          tempTransactionsOnDate[currentDay.toISOString().split('T')[0]] || [];

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

        const transactionsByAccount: { [accountId: string]: Transaction[] } = {};

        // Populate the object
        transactions.forEach((transaction) => {
          let accountIds: string[] = [];
        
          if (transaction.type === TransactionType.DEPOSIT && transaction.toAccount) {
            accountIds.push(transaction.toAccount);
          } else if (transaction.type === TransactionType.WITHDRAWAL && transaction.fromAccount) {
            accountIds.push(transaction.fromAccount);
          } else if (transaction.type === TransactionType.TRANSFER) {
            if (transaction.fromAccount) {
              accountIds.push(transaction.fromAccount);
            }
            if (transaction.toAccount) {
              accountIds.push(transaction.toAccount);
            }
          }
        
          accountIds.forEach((accountId) => {
            const existingTransactions = transactionsByAccount[accountId] || [];
            existingTransactions.push(transaction);
            transactionsByAccount[accountId] = existingTransactions;
          });
        });
        
        // Store it in the Redux state
        state.transactionsByAccount = transactionsByAccount;

        runTodaysInterest(dateKey);

        currentDay.setDate(currentDay.getDate() + 1);
        iterations++;
      }
      
      function updateAccountMessages(accountId: string, date: string, type: string, account: Account) {
        // Initialize the array for this accountId if it doesn't exist
        if (!state.accountMessages[accountId]) {
          state.accountMessages[accountId] = [];
        }
      
        // Check if this type already exists for this accountId
        const typeExists = state.accountMessages[accountId].some((item) => item.type === type);
      
        // Check for snoozed messages with the same type and date within the last week
        const isSnoozed = account.snoozedMessages?.some((snoozedMsg) => {
          return snoozedMsg.messageType === type &&
            differenceInDays(new Date(), parseISO(snoozedMsg.date)) < 7; // TODO: Make the snoozed range user definable!
        });
      
        // If this type doesn't exist and is not snoozed, add the new type/date pair
        if (!typeExists && !isSnoozed) {
          state.accountMessages[accountId].push({ date, type, account });
        }
      }
      

      const removeOldTransactions = () => {
        let today = new Date(new Date().setDate(new Date().getDate()-1));

        today.setHours(0, 0, 0, 0);

        Object.keys(tempTransactionsOnDate).forEach((date) => {
          const transactionDate = new Date(date); // TODO: IF AUTO CLEAR! FUTURE FEATURE! 
          if (transactionDate < today) {
            delete tempTransactionsOnDate[date];
          }
        });
      };
      removeOldTransactions();
// console.log('Old',tempTransactionsOnDate)
// console.log('New',newTempTransactionsOnDate)










// const deepEqual = (a: Transaction, b: Transaction): boolean => {
//   return JSON.stringify(a) === JSON.stringify(b);
// }

// const compareTransactionMaps = (
//   oldMap: { [date: string]: Transaction[] },
//   newMap: { [date: string]: Transaction[] }
// ) => {
//   const differences: string[] = [];

//   // Check for dates only present in oldMap
//   Object.keys(oldMap).forEach((date) => {
//     if (!newMap[date]) {
//       differences.push(`Date ${date} only present in oldMap.`);
//     }
//   });

//   // Check for dates only present in newMap
//   Object.keys(newMap).forEach((date) => {
//     if (!oldMap[date]) {
//       differences.push(`Date ${date} only present in newMap.`);
//     }
//   });

//   // Check for differences in transactions for dates present in both
//   Object.keys(oldMap).forEach((date) => {
//     if (newMap[date]) {
//       const oldTransactions = oldMap[date];
//       const newTransactions = newMap[date];

//       if (oldTransactions.length !== newTransactions.length) {
//         differences.push(`Different number of transactions for date ${date}.`);
//       } else {
//         for (let i = 0; i < oldTransactions.length; i++) {
//           if (!deepEqual(oldTransactions[i], newTransactions[i])) {
//             differences.push(`Different transaction at index ${i} for date ${date}.`);
//           }
//         }
//       }
//     }
//   });

//   return differences;
// };


// const differences = compareTransactionMaps(tempTransactionsOnDate, newTempTransactionsOnDate);
// console.log(differences);





      state.transactionsOnDate      = tempTransactionsOnDate;
      state.balanceByDateAndAccount = tempBalanceByDateAndAccount;
      state.categorySpend           = tempCategorySpend;
      state.spendByTransaction      = tempTransactionSpend;

      const endTime = performance.now();
      console.log(`Recalculating Projections took ${(endTime - startTime).toFixed(2)} milliseconds to execute.`);
    },
  },
});

//  ___       ___     ___            __  ___    __        __  
//   |  |__| |__     |__  |  | |\ | /  `  |  | /  \ |\ | /__` 
//   |  |  | |___    |    \__/ | \| \__,  |  | \__/ | \| .__/ 
//                                                            

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
  state    : RootState,
  accountID: string,
  date     : string
) => {
  const balanceByDateAndAccount = state.projections.balanceByDateAndAccount || {};
  const accountBalance          = balanceByDateAndAccount[accountID] || {};

  const today                   = new Date(state.activeDates.today);
  const todayISOString          = today.toISOString().split('T')[0];
  const inputDate               = new Date(date);

  if (inputDate <= today) {
    date = todayISOString;
  } else {
    date = inputDate.toISOString().split('T')[0];
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
  const todayISOString          = today.toISOString().split('T')[0];
  const inputDate               = new Date(date);

  if (inputDate <= today) {
    date = todayISOString;
  } else {
    date = inputDate.toISOString().split('T')[0];
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
    const dateKey = start.toISOString().split('T')[0];
    balances.push(accountBalance[dateKey] || 0);
    start.setDate(start.getDate() + 1);
  }
  return balances;
};

// Get Spending Power for a date
export const getSpendingPowerByDate = (
  state    : RootState,
  date     : string
  ) => {
  let workingValue = 0;
  if (allAccounts) {
    allAccounts.forEach((account) => {
      if (account && account.isSpendingPower) {
        switch (account.type) {
          case 'checking':
          case 'savings':
          case 'cash':
            workingValue += accountBalanceOnDate(state, account.id, date);
            break;
          case 'credit card':
            if(account.creditLimit) {
            const availableCredit = account.creditLimit - accountBalanceOnDate(state, account.id, date);
            if (availableCredit > 0) {
              workingValue += availableCredit;
            }
          }
            break;
          default:
            break;
        }
      }
    })
  }

  return workingValue;
};

// Get Savings for a date
export const getSavingsByDate = (
  state: RootState,
  date: string
): number | null => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {
      if (account && account.type === 'savings' && account.isSpendingPower) {
        hasRequiredAccount = true;
        workingValue += accountBalanceOnDate(state, account.id, date);
      }
    });
  }

  return hasRequiredAccount ? workingValue : null;
};


// Get Cash for a date
export const getCashByDate = (
  state    : RootState,
  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {
      if (account && (account.type === 'checking' || account.type === 'cash' ) && account.isSpendingPower) {
        hasRequiredAccount = true;
        workingValue += accountBalanceOnDate(state, account.id, date);   
      }
    })
  }

  return hasRequiredAccount ? workingValue : null;
};

// Get Available Credit for a date
export const getAvailableCreditByDate = (
  state    : RootState,
  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {
      if (account && account.type === 'credit card' && account.creditLimit) {
        hasRequiredAccount = true;
        const availableCredit = account.creditLimit - accountBalanceOnDate(state, account.id, date);
        if (availableCredit > 0) {
          workingValue += availableCredit;
        }
      }
    })
  }

  return hasRequiredAccount ? workingValue : null;
};

// Get Debt for a date
export const getDebtByDate = (
  state    : RootState,
  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {

      if (account && account.isSpendingPower) {
        switch (account.type) {
          case 'loan':
          case 'credit card':
            hasRequiredAccount = true;
            workingValue += accountBalanceOnDate(state, account.id, date);
            break;
          default:
            break;
        }
      }
    })
  }

  return hasRequiredAccount ? workingValue : null;
};

// Get Credit Card Debt for a date
export const getCreditCardDebtByDate = (
  state    : RootState,
  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {
      if (account && account.isSpendingPower) {
        switch (account.type) {
          case 'credit card':
            hasRequiredAccount = true;
            workingValue += accountBalanceOnDate(state, account.id, date);
            break;
          default:
            break;
        }
      }
    })
  }

  return hasRequiredAccount ? workingValue : null;
};

// Get Loan Debt for a date
export const getLoanDebtByDate = (
  state    : RootState,
  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {

      if (account) { // TODO: I need a new Show In Projections option. So, Show In Graph, Show In Schedule, Show In Projection
        switch (account.type) {
          case 'loan':
            hasRequiredAccount = true;
            workingValue += accountBalanceOnDate(state, account.id, date);
            break;
          default:
            break;
        }
      }
    })
  }

  return hasRequiredAccount ? workingValue : null;
};

// Get Net Worth for a date
export const getNetWorthByDate = (
  state    : RootState,
  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  let theSavings = getSavingsByDate(state, date)
  let theCash    = getCashByDate(state, date)
  let theDebt    = getDebtByDate(state, date)

  if (theSavings !== null && theCash !== null && theDebt !== null) {
    hasRequiredAccount = true;
    workingValue = theSavings + theCash - theDebt
  } 

  return hasRequiredAccount ? workingValue : null;
};

// Get account messages
interface Message {
  accountId: string;
  type: string;
  date: string;
  account: Account;
}

export const getAccountMessages = (state: RootState, account?: Account): Message[] => {
  const messages: Message[] = [];

  if (!state.projections.accountMessages || Object.keys(state.projections.accountMessages).length === 0) {
    return messages;
  }

  if (account) {
    const accountId = account.id;
    const accountMessages = state.projections.accountMessages[accountId];
    if (accountMessages) {
      accountMessages.forEach((message) => {
        messages.push({ accountId, type: message.type, date: message.date, account: message.account });
      });
    }
  } else {
    for (const accId in state.projections.accountMessages) {
      const accountMessages = state.projections.accountMessages[accId];
      accountMessages.forEach((message) => {
        messages.push({ accountId: accId, type: message.type, date: message.date, account: message.account });
      });
    }
  }

  return messages;
};

// Get Transactions By Account
export const getTransactionsByAccount = (
  state: RootState,
  accountId?: string
) => {
  if (accountId) {
    return state.projections.transactionsByAccount[accountId] || [];
  } else {
    return Object.values(state.projections.transactionsByAccount).flat();
  }
};

// Get Spend By Transactions
export const getSpendByTransaction = (
  state: RootState,
  transactionId: string
) => {
    return state.projections.spendByTransaction[transactionId] || undefined;
};

export default projectionsSlice.reducer;










































  // console.log(transaction.transactionName,dateArray)
  // dateArray.forEach((date) => {
  //   const dateString = date.toISOString().split('T')[0]; // Converting Date to 'YYYY-MM-DD' string format
  //   if (!newTempTransactionsOnDate[dateString]) {
  //     newTempTransactionsOnDate[dateString] = [];
  //   }
  //   newTempTransactionsOnDate[dateString].push(transaction); // Push the current transaction
  // });
  



// console.log(transaction.transactionName, dateArray, transaction);

          
//  ___       ___     __        __                   
//   |  |__| |__     /  \ |    |  \    |  |  /\  \ / 
//   |  |  | |___    \__/ |___ |__/    |/\| /~~\  |  
//                                                   

        //   let count: number = 0;
        //   let transactionDate    = new Date(transaction.date);
        //   const transactionEndDate = transaction.isRecurring
        //     ? transaction.endDate
        //       ? new Date(
        //           Math.min(
        //             calculateThruDate.getTime(),
        //             new Date(transaction.endDate).getTime()
        //           )
        //         )
        //       : calculateThruDate
        //     : transactionDate;

        //     let arrayPosition: number = 0;

        //   while (
        //     transactionDate <= transactionEndDate && count < maxIterations
        //   ) {
        //     count++;
        //     const dateString = transactionDate.toISOString().split('T')[0];

        //     if (!tempTransactionsOnDate[dateString]) {
        //       tempTransactionsOnDate[dateString] = [];
        //     }
            
        //     tempTransactionsOnDate[dateString].push(transaction);
      
        //     if (transaction.isRecurring) {
      
        //       let caseFound = false; // Add a flag to check if a switch case was met
      
        //       // Increase date based on recurrence interval
        //       switch (transaction.recurrenceFrequency) {
        //         case 'daily':
        //           transactionDate.setDate(transactionDate.getDate() + 1);
        //           caseFound = true;
        //           break;
        //         case 'weekly':
        //           transactionDate.setDate(transactionDate.getDate() + 7);
        //           caseFound = true;
        //           break;
        //         case 'monthly':
        //           transactionDate.setMonth(transactionDate.getMonth() + 1);
        //           caseFound = true;
        //           break;
        //         case 'yearly':
        //           transactionDate.setFullYear(
        //             transactionDate.getFullYear() + 1
        //           );
        //           caseFound = true;
        //           break;
        //         case 'given days':
        //           if (transaction.givenDays && transaction.givenDays.length > 0) {
        //             const currentDayOfWeek = transactionDate.getDay();
        //             let   closestDayOfWeek = null;
        //             let   minDaysUntilNext = Infinity;
                
        //             for (const dayOfWeek of transaction.givenDays) {
        //               const daysUntilNext = (dayOfWeek - currentDayOfWeek + 7) % 7 || 7;
        //               if (daysUntilNext < minDaysUntilNext) {
        //                 minDaysUntilNext = daysUntilNext;
        //                 closestDayOfWeek = dayOfWeek;
        //               }
        //             }
                
        //             if (closestDayOfWeek !== null) {
        //               transactionDate.setDate(transactionDate.getDate() + minDaysUntilNext);
        //               caseFound = true;
        //             }
        //           }
        //           break;
        //         case 'twice monthly':
        //           const initialDate = new Date(transaction.date).getDate();

        //           const currentDay = transactionDate.getDate();
        //           const currentMonth = transactionDate.getMonth();
        //           const currentYear = transactionDate.getFullYear();
        //           const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        //           const daysAway = Math.abs(currentDay - initialDate);

        //           if (currentDay < 15) {
        //             transactionDate.setDate(currentDay + 14);
        //           } else {
        //             transactionDate.setDate(currentDay - 14);
        //             transactionDate.setMonth(currentMonth + 1);
        //           }

        //           if (daysAway > 10 && daysAway < 18) {
        //             if (transactionDate.getDate() < initialDate) {
        //               transactionDate.setMonth(currentMonth);
        //               transactionDate.setFullYear(currentYear);
        //               if (initialDate > daysInCurrentMonth) {
        //                 transactionDate.setDate(daysInCurrentMonth);
        //               } else {
        //                 transactionDate.setDate(initialDate);
        //               }
        //             }
        //           }
        //           caseFound = true;
        //           break;
        //         case 'custom':
        //           if (transaction.recurrenceInterval) {
        //             switch (transaction.customIntervalType) {
        //               case 'day':
        //                 transactionDate.setDate(transactionDate.getDate() + transaction.recurrenceInterval);
        //                 caseFound = true;
        //                 break;
        //               case 'week':
        //                 transactionDate.setDate(transactionDate.getDate() + transaction.recurrenceInterval * 7);
        //                 caseFound = true;
        //                 break;
        //               case 'month':
        //                 transactionDate.setMonth(transactionDate.getMonth() + transaction.recurrenceInterval);
        //                 caseFound = true;
        //                 break;
        //               case 'year':
        //                 transactionDate.setFullYear(transactionDate.getFullYear() + transaction.recurrenceInterval);
        //                 caseFound = true;
        //                 break;
        //               default:
        //                 break;
        //             }
        //           }
        //           break;
        //           case 'arbitrary':  
        //           if (transaction.arbitraryDates && transaction.arbitraryDates.length > 0) {
        //             if (arrayPosition < transaction.arbitraryDates.length) {
        //               transactionDate = new Date(transaction.arbitraryDates[arrayPosition]);
        //               caseFound = true;
        //               arrayPosition ++;
        //             }
        //           }
        //           break;
        //         default:
        //           break;
        //       }
      
        //       if (!caseFound) {
        //         break;
        //       }
      
        //     } else {
        //       break;
        //     }
        //   }
import { addMonths, isBefore, isWithinInterval, addYears, parseISO, differenceInDays } from 'date-fns'; 

import { createSlice, PayloadAction }                                 from '@reduxjs/toolkit';

import { Transaction }                                                from './../../models/Transaction';
import { Account }                                                    from './../../models/Account';
import { RootState }                                                  from './../store';
import { TransactionType }                                            from './../../utils/constants';

import { RRule, RRuleSet } from 'rrule';

import { startOfDay, addDays, format } from 'date-fns'
import { createDateInLocalTimeZone } from '../../utils/dateUtils';

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
      const today = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const calculateThruDate = new Date(
        new Date(farDate).setHours(0, 0, 0, 0)
      );

      allAccounts = accounts;
      state.transactionsOnDate = {};
      state.balanceByDateAndAccount = {};
      state.categorySpend = {};
      state.accountMessages = {};

      let tempTransactionsOnDate: { [date: string]: Transaction[] } = {};
      let tempBalanceByDateAndAccount: {
        [accountId: string]: { [date: string]: number };
      } = {};
      let tempCategorySpend: { [category: string]: number } = {};
      let tempTransactionSpend: { [transactionID: string]: number } = {};

      accounts.forEach((account) => {
        const currentDay = new Date(new Date(today).setHours(0, 0, 0, 0));
        const dateKey = currentDay.toISOString().split('T')[0];
        if (
          isBefore(addMonths(parseISO(account.lastUpdated), 1), currentDay) &&
          account.notifyOnAccountStale
        ) {
          updateAccountMessages(account.id, dateKey, 'accountStale', account);
        }

        if (!tempBalanceByDateAndAccount[account.id]) {
          tempBalanceByDateAndAccount[account.id] = {};
        }
        tempBalanceByDateAndAccount[account.id][dateKey] =
          account.currentBalance;
      });

      // Helper to add a transaction to tempTransactionsOnDate
      const addTransactionToTemp = (
        tempTransactionsOnDate: Record<string, Transaction[]>,
        date: Date,
        transaction: Transaction
      ) => {          

        const dateString = format(createDateInLocalTimeZone(date), 'yyyy-MM-dd');

        if (!tempTransactionsOnDate[dateString]) {
          tempTransactionsOnDate[dateString] = [];
        }

        const existingEventIds = new Set(
          tempTransactionsOnDate[dateString].map((t) => t.event_id)
        );

        if (!existingEventIds.has(transaction.event_id)) {

          if (!new Set(transaction.exdates).has(dateString)) {
            // Your logic here for when the dateString is in the exdates array
            tempTransactionsOnDate[dateString].push(transaction);
          }
          
        }
      };

      const populateTransactionsOnDate = () => {
        const today = new Date();
        today.setHours(today.getHours() + 12, 0, 0, 0);
        
        const farDateObj = new Date(farDate);
        farDateObj.setHours(0, 0, 0, 0);        
        
        transactions.forEach((transaction) => {
          // Handle recurring transactions
          
          let dateArray: Date[] = [];

          const rruleSet = new RRuleSet();

          if (transaction.rrule) {
            const serializedSet = JSON.parse(transaction.rrule);
            if (serializedSet.rrule) {
              const rrule = RRule.fromString(serializedSet.rrule);

              rruleSet.rrule(new RRule(rrule.origOptions));
            }

            // Add any RDATEs to the set
            if (Array.isArray(serializedSet.rdates)) {
              serializedSet.rdates.forEach((dateStr: string) => {
                const date = new Date(dateStr);
                rruleSet.rdate(date);
              });
            }
          }

          // Add any EXDATEs to the set from transaction.exdates
          if (Array.isArray(transaction.exdates)) { 
            // TODO: This isn't actually working. There's a safety catch in the addTransactionToTemp function for now. Fix it! 
            transaction.exdates.forEach((dateStr: string) => {
              const date = new Date(dateStr);
              rruleSet.exdate(date);
            });
          }

          dateArray = rruleSet.between(today, farDateObj);
          dateArray = dateArray.map(date => {
              const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
              return localDate;
          });
          
          // Handle non-recurring events or bunk RRules.
          if (
            (transaction.rrule.includes('"rrule":null') &&
              transaction.rrule.includes('"rdates":[]')) ||
            transaction.rrule === null
          ) {
            const startDate = startOfDay(new Date(transaction.start_date));
            if (startDate >= today && startDate <= farDateObj) {
              dateArray.push(startDate);
            }
          }

          dateArray.forEach((date) =>
            addTransactionToTemp(tempTransactionsOnDate, date, transaction)
          );

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
            // eslint-disable-next-line eqeqeq
            if (
              accountType === 'credit card' ||
              accountType === 'loan' ||
              accountType === 'savings'
            ) {
              // Calculate interest on daily compounding accounts.
              interest = balance * ((interestRate * 0.01) / 365);
              // eslint-disable-next-line eqeqeq
            } else if (accountType == 'mortgage') {
              // Calculate interest for mortgage (monthly compounding)
              const annualInterestRateDecimal = interestRate / 100;
              const monthlyInterestRate = annualInterestRateDecimal / 12;
              interest = interest = monthlyInterestRate * balance;
            }
          }
          return Math.round(interest);
        };

        // If the account is a mortgage, is interest due today
        function isMortgageDue(account: Account, currentDay: Date): boolean {
          if (account.type !== 'mortgage') return false;

          const currentDayDate = currentDay.getUTCDate();
          const daysInMonth = new Date(
            currentDay.getUTCFullYear(),
            currentDay.getUTCMonth() + 1,
            0
          ).getUTCDate();

          if (account.dueDate) {
            const dateDue = new Date(account.dueDate).getUTCDate();
            return (
              dateDue === currentDayDate ||
              (daysInMonth < dateDue && currentDayDate === daysInMonth)
            );
          } else {
            return currentDayDate === 1;
          }
        }

        accounts.forEach((account) => {
          const accountId = account.id;
          let activeBalance = tempBalanceByDateAndAccount[accountId][dateKey];

          if (
            activeBalance > 0 &&
            (account.type === 'savings' ||
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

      function sumUpSpend(transaction: Transaction, date: string) {

        if (
          isWithinInterval(parseISO(date), {
            start: new Date(),
            end: addYears(new Date(), 1),
          })
        ) {
  
          if (!tempTransactionSpend[transaction.event_id]) {
            tempTransactionSpend[transaction.event_id] = 0;
          }

          // Add the amount of the spend if its with in this year.
          tempTransactionSpend[transaction.event_id] += Math.abs(transaction.amount);

          // Run the annual category math
          const tempCategory: string = transaction.category || 'Uncategorized'
  
          if (!tempCategorySpend[tempCategory]) {
            tempCategorySpend[transaction.category || 'Uncategorized'] = 0;
          }
          tempCategorySpend[tempCategory] += transaction.amount;

        }
      }

      function handleTransfer(
        tempBalanceByDateAndAccount: BalanceData,
        transaction: Transaction,
        dateKey: string,
        toAccount?: Account,
        fromAccount?: Account,
        category?: string
      ) {
        if (!toAccount || !fromAccount) return;

        let toAccountBalance =
          tempBalanceByDateAndAccount[toAccount.id][dateKey];
        let transferAmount = transaction.amount;

        if (toAccount.isLiability) {
          // TODO: THIS ISN'T ALLOWING OVERPAYMENT, and that's great, but it should check if overpayment is allowed.
          if (
            transaction.amount >
              tempBalanceByDateAndAccount[toAccount.id][dateKey] &&
            toAccount.notifyOnAccountPayoff &&
            (toAccount.type === 'loan' ||
              toAccount.type === 'credit card' ||
              toAccount.type === 'mortgage')
          ) {
            updateAccountMessages(
              toAccount.id,
              dateKey,
              'accountPayoff',
              toAccount
            );
          }
          // TODO: THIS IS CORRECT. Also where I need to look into allowOverPayment and adjust accordingly.
          transferAmount = Math.min(transaction.amount, toAccountBalance);
        }
        const toAccountSign = toAccount.isLiability ? -1 : 1;
        const fromAccountSign = fromAccount.isLiability ? 1 : -1;

        sumUpSpend(transaction, dateKey);
        tempBalanceByDateAndAccount[toAccount.id][dateKey] +=
          transferAmount * toAccountSign;
        tempBalanceByDateAndAccount[fromAccount.id][dateKey] +=
          transferAmount * fromAccountSign;
      }

      function handleWithdrawal(
        tempBalanceByDateAndAccount: BalanceData,
        transaction: Transaction,
        dateKey: string,
        toAccount?: Account,
        fromAccount?: Account,
        category?: string
      ) {
        if (!fromAccount) return;

        sumUpSpend(transaction, dateKey);

        if (fromAccount.isLiability) {
          if (fromAccount.creditLimit) {
            // TODO: THIS IS NOT RESPECTING ALLOW OVERDRAFT or any such.
            if (
              transaction.amount >
                fromAccount.creditLimit -
                  tempBalanceByDateAndAccount[fromAccount.id][dateKey] &&
              fromAccount.notifyOnAccountOverCredit &&
              fromAccount.type === 'credit card'
            ) {
              updateAccountMessages(
                fromAccount.id,
                dateKey,
                'accountOverCredit',
                fromAccount
              );
            }
          }
          // TODO: THIS IS CORRECT. Also where I need to look into allowOverPayment and adjust accordingly.
          tempBalanceByDateAndAccount[fromAccount.id][dateKey] +=
            transaction.amount;
        } else {
          if (fromAccount) {
            if (
              transaction.amount >
                tempBalanceByDateAndAccount[fromAccount.id][dateKey] &&
              fromAccount.notifyOnAccountOverDraft &&
              (fromAccount.type === 'checking' ||
                fromAccount.type === 'savings' ||
                fromAccount.type === 'cash')
            ) {
              updateAccountMessages(
                fromAccount.id,
                dateKey,
                'accountOverdraft',
                fromAccount
              );
            }
          }

          tempBalanceByDateAndAccount[fromAccount.id][dateKey] -=
            transaction.amount;
        }

      }

      function handleDeposit(
        tempBalanceByDateAndAccount: BalanceData,
        transaction: Transaction,
        dateKey: string,
        toAccount?: Account,
        fromAccount?: Account,
        category?: string
      ) {
        if (!toAccount) return;
        sumUpSpend(transaction, dateKey);

        if (toAccount.isLiability) {
          tempBalanceByDateAndAccount[toAccount.id][dateKey] -=
            transaction.amount;
        } else {
          tempBalanceByDateAndAccount[toAccount.id][dateKey] +=
            transaction.amount;
        }
      }

      const TRANSACTION_TYPES = {
        TRANSFER: 'transfer',
        WITHDRAWAL: 'withdrawal',
        DEPOSIT: 'deposit',
      };

      const transactionTypeHandlers = {
        [TRANSACTION_TYPES.TRANSFER]: handleTransfer,
        [TRANSACTION_TYPES.WITHDRAWAL]: handleWithdrawal,
        [TRANSACTION_TYPES.DEPOSIT]: handleDeposit,
      };

      populateTransactionsOnDate();

      let currentDay = new Date(new Date(today).setHours(12, 0, 0, 0));
      let iterations = 0;

      while (currentDay <= calculateThruDate && iterations < maxIterations) {
        const dateKey = format(currentDay, 'yyyy-MM-dd');
        const prevDateKey = format(addDays(currentDay, -1), 'yyyy-MM-dd');

        // Set start balance for each account on this date
        accounts.forEach((account) => {
          tempBalanceByDateAndAccount[account.id][dateKey] =
            tempBalanceByDateAndAccount[account.id][prevDateKey] !== undefined
              ? tempBalanceByDateAndAccount[account.id][prevDateKey]
              : account.currentBalance;
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

          let category = transaction.category;

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

        const transactionsByAccount: { [accountId: string]: Transaction[] } =
          {};

        // Populate the object
        transactions.forEach((transaction) => {
          let accountIds: string[] = [];

          if (
            transaction.type === TransactionType.DEPOSIT &&
            transaction.toAccount
          ) {
            accountIds.push(transaction.toAccount);
          } else if (
            transaction.type === TransactionType.WITHDRAWAL &&
            transaction.fromAccount
          ) {
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

      function updateAccountMessages(
        accountId: string,
        date: string,
        type: string,
        account: Account
      ) {
        // Initialize the array for this accountId if it doesn't exist
        if (!state.accountMessages[accountId]) {
          state.accountMessages[accountId] = [];
        }

        // Check if this type already exists for this accountId
        const typeExists = state.accountMessages[accountId].some(
          (item) => item.type === type
        );

        // Check for snoozed messages with the same type and date within the last week
        const isSnoozed = account.snoozedMessages?.some((snoozedMsg) => {
          return (
            snoozedMsg.messageType === type &&
            differenceInDays(new Date(), parseISO(snoozedMsg.date)) < 7
          ); // TODO: Make the snoozed range user definable!
        });

        // If this type doesn't exist and is not snoozed, add the new type/date pair
        if (!typeExists && !isSnoozed) {
          state.accountMessages[accountId].push({ date, type, account });
        }
      }

      const removeOldTransactions = () => {
        let today = new Date(new Date().setDate(new Date().getDate() - 1));

        today.setHours(0, 0, 0, 0);

        Object.keys(tempTransactionsOnDate).forEach((date) => {
          const transactionDate = new Date(date); // TODO: IF AUTO CLEAR! FUTURE FEATURE!
          if (transactionDate < today) {
            delete tempTransactionsOnDate[date];
          }
        });
      };
      
      removeOldTransactions();

      state.transactionsOnDate = tempTransactionsOnDate;
      state.balanceByDateAndAccount = tempBalanceByDateAndAccount;
      state.categorySpend = tempCategorySpend;
      state.spendByTransaction = tempTransactionSpend;

      const endTime = performance.now();
      console.log(
        `Recalculating Projections took ${(endTime - startTime).toFixed(
          2
        )} milliseconds to execute.`
      );
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
export const dateHasTransactions = (
  projections: ProjectionsState,
  date: string) => {
  return projections.transactionsOnDate[date] !== undefined || false;
};

// Get categorized spend amounts
export const getCategorySpend = (state: RootState) => {
  return state.projections.categorySpend;
};

// Get account balance on a specific date
export const accountBalanceOnDate = (
  projections: ProjectionsState,
  accountID: string,
  date     : string
) => {
  const balanceByDateAndAccount = projections.balanceByDateAndAccount || {};
  const accountBalance          = balanceByDateAndAccount[accountID] || {};

  const today                   = new Date();
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
  projections: ProjectionsState,
  date: string
) => {
  const balanceByDateAndAccount = projections.balanceByDateAndAccount || {};
  
  const today                   = new Date();
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
  projections: ProjectionsState,
  startIndex: number,
  endIndex  : number
) => {
  const allTransactions: { transaction: Transaction; date: string }[] = [];

  // Flatten the transactionsOnDate object into a single array
  Object.entries(projections.transactionsOnDate).forEach(
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
  projections: ProjectionsState,
  startDate: string,
  endDate: string
) => {
  let theStart: Date = new Date(startDate);
  let theEnd: Date = new Date(endDate);

  const groupedTransactions: { date: string; transactions: { transaction: Transaction; date: string }[] }[] = [];

  // Sort the keys (dates) before processing
  const sortedDates = Object.keys(projections.transactionsOnDate).sort();

  sortedDates.forEach((date) => {
    const transactionsOnDate: Transaction[] = projections.transactionsOnDate[date] || [];
    if (new Date(date) >= theStart && new Date(date) <= theEnd) {
      const transactionsForDate = transactionsOnDate.map(transaction => ({ transaction, date: date }));
      groupedTransactions.push({ date: date, transactions: transactionsForDate });
    }
  });
  
  return groupedTransactions;
};
// Get account balances for a date range
export const accountBalancesByDateRange = (
  projections: ProjectionsState,
  account  : Account,
  startDate: string,
  endDate  : string
) => {
  const balanceByDateAndAccount = projections.balanceByDateAndAccount || {};
  const accountBalance          = balanceByDateAndAccount[account.id] || {};
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
  projections: ProjectionsState,
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
            workingValue += accountBalanceOnDate(projections, account.id, date);
            break;
          case 'credit card':
            if(account.creditLimit) {
            const availableCredit = account.creditLimit - accountBalanceOnDate(projections, account.id, date);
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
  projections: ProjectionsState,
  date: string
): number | null => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {
      if (account && account.type === 'savings' && account.isSpendingPower) {
        hasRequiredAccount = true;
        workingValue += accountBalanceOnDate(projections, account.id, date);
      }
    });
  }

  return hasRequiredAccount ? workingValue : null;
};


// Get Cash for a date
export const getCashByDate = (
  projections: ProjectionsState,
  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {
      if (account && (account.type === 'checking' || account.type === 'cash' ) && account.isSpendingPower) {
        hasRequiredAccount = true;
        workingValue += accountBalanceOnDate(projections, account.id, date);   
      }
    })
  }

  return hasRequiredAccount ? workingValue : null;
};

// Get Available Credit for a date
export const getAvailableCreditByDate = (
  projections: ProjectionsState,
  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  if (allAccounts) {
    allAccounts.forEach((account) => {
      if (account && account.type === 'credit card' && account.creditLimit) {
        hasRequiredAccount = true;
        const availableCredit = account.creditLimit - accountBalanceOnDate(projections, account.id, date);
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
  projections: ProjectionsState,
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
            workingValue += accountBalanceOnDate(projections, account.id, date);
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
  projections: ProjectionsState,
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
            workingValue += accountBalanceOnDate(projections, account.id, date);
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
  projections: ProjectionsState,
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
            workingValue += accountBalanceOnDate(projections, account.id, date);
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
  projections: ProjectionsState,

  date     : string
  ) => {
  let workingValue = 0;
  let hasRequiredAccount = false;

  let theSavings = getSavingsByDate(projections, date)
  let theCash    = getCashByDate(projections, date)
  let theDebt    = getDebtByDate(projections, date)

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

export const getAccountMessages = (
  projections: ProjectionsState,
  account?: Account
): Message[] => {
  const messages: Message[] = [];

  if (!projections.accountMessages || Object.keys(projections.accountMessages).length === 0) {
    return messages;
  }

  if (account) {
    const accountId = account.id;
    const accountMessages = projections.accountMessages[accountId];
    if (accountMessages) {
      accountMessages.forEach((message) => {
        messages.push({ accountId, type: message.type, date: message.date, account: message.account });
      });
    }
  } else {
    for (const accId in projections.accountMessages) {
      const accountMessages = projections.accountMessages[accId];
      accountMessages.forEach((message) => {
        messages.push({ accountId: accId, type: message.type, date: message.date, account: message.account });
      });
    }
  }

  return messages;
};

// Get Transactions By Account
export const getTransactionsByAccount = (
  projections: ProjectionsState,
  accountId?: string
) => {
  if (accountId) {
    return projections.transactionsByAccount[accountId] || [];
  } else {
    return Object.values(projections.transactionsByAccount).flat();
  }
};

// Get Spend By Transactions
export const getSpendByTransaction = (
  projections: ProjectionsState,
  transactionId: string
) => {
    return projections.spendByTransaction[transactionId] || undefined;
};

export default projectionsSlice.reducer;
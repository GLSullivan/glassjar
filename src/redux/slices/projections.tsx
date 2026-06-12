import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Transaction } from './../../models/Transaction';
import { Account } from './../../models/Account';
import { RootState } from './../store';
import { AccountType } from './../../utils/constants';
import {
  AccountMessage,
  FloatingOccurrence,
  ProjectionResult,
  runProjection,
} from './../../utils/projectionEngine';
import {
  DateKey,
  anyToDateKey,
  eachDateKey,
  toDateKey,
} from './../../utils/dateKey';

interface ProjectionsState {
  transactionsOnDate     : { [date: string]: Transaction[] };
  balanceByDateAndAccount: { [accountId: string]: { [date: string]: number } };
  categorySpend          : { [category: string]: number };
  accountMessages        : { [accountId: string]: AccountMessage[] };
  transactionsByAccount  : { [accountId: string]: Transaction[] };
  spendByTransaction     : { [transactionID: string]: number };
  floatingTransactions   : FloatingOccurrence[];
}

const initialState: ProjectionsState = {
  transactionsOnDate     : {},
  balanceByDateAndAccount: {},
  categorySpend          : {},
  accountMessages        : {},
  transactionsByAccount  : {},
  spendByTransaction     : {},
  floatingTransactions   : [],
};

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

      const result: ProjectionResult = runProjection({
        accounts,
        transactions,
        startKey: toDateKey(new Date()),
        endKey  : anyToDateKey(farDate),
      });

      state.transactionsOnDate      = result.transactionsOnDate;
      state.balanceByDateAndAccount = result.balanceByDateAndAccount;
      state.categorySpend           = result.categorySpend;
      state.accountMessages         = result.accountMessages;
      state.transactionsByAccount   = result.transactionsByAccount;
      state.spendByTransaction      = result.spendByTransaction;
      state.floatingTransactions    = result.floatingTransactions;

      const endTime = performance.now();
      console.log(
        `Recalculating Projections took ${(endTime - startTime).toFixed(2)} milliseconds to execute.`
      );
    },
  },
});

export const { recalculateProjections } = projectionsSlice.actions;

//  ___       ___     ___            __  ___    __        __
//   |  |__| |__     |__  |  | |\ | /  `  |  | /  \ |\ | /__`
//   |  |  | |___    |    \__/ | \| \__,  |  | \__/ | \| .__/
//

/** Clamp a date-ish input to a DateKey no earlier than today (history reads as today). */
const toClampedKey = (date: string | Date): DateKey => {
  const key = anyToDateKey(date);
  const todayKey = toDateKey(new Date());
  return key < todayKey ? todayKey : key;
};

// Get transactions by date
export const getTransactionsByDate = (state: RootState, activeDate: string) => {
  return state.projections.transactionsOnDate[anyToDateKey(activeDate)] || [];
};

// Check if a date has transactions
export const dateHasTransactions = (
  projections: ProjectionsState,
  date: string | Date
) => {
  return projections.transactionsOnDate[anyToDateKey(date)] !== undefined;
};

// Get categorized spend amounts
export const getCategorySpend = (state: RootState) => {
  return state.projections.categorySpend;
};

// Get account balance on a specific date
export const accountBalanceOnDate = (
  projections: ProjectionsState,
  accountID  : string,
  date       : string | Date
) => {
  const accountBalance = (projections.balanceByDateAndAccount || {})[accountID] || {};
  return accountBalance[toClampedKey(date)] || 0;
};

// Get the aggregate balance of all graphed accounts on a date (liabilities negative)
export const aggregateBalanceOnDate = (
  projections: ProjectionsState,
  accounts   : Account[],
  date       : string | Date
) => {
  const balanceByDateAndAccount = projections.balanceByDateAndAccount || {};
  const key = toClampedKey(date);

  let totalBalance = 0;
  for (const account of accounts) {
    if (!account.showInGraph) continue;
    const balance = (balanceByDateAndAccount[account.id] || {})[key] || 0;
    totalBalance += account.isLiability ? -balance : balance;
  }
  return totalBalance;
};

// Get transactions in range.
export const getTransactionsByRange = (
  projections: ProjectionsState,
  startIndex : number,
  endIndex   : number
) => {
  const allTransactions: { transaction: Transaction; date: string }[] = [];

  // DateKeys sort chronologically as strings.
  const sortedDates = Object.keys(projections.transactionsOnDate).sort();
  for (const date of sortedDates) {
    for (const transaction of projections.transactionsOnDate[date]) {
      allTransactions.push({ transaction, date });
    }
  }

  return allTransactions.slice(startIndex, endIndex);
};

// Get transactions grouped by day in a date range.
export const getTransactionsByDateRange = (
  projections: ProjectionsState,
  startDate  : string,
  endDate    : string
) => {
  const startKey = anyToDateKey(startDate);
  const endKey   = anyToDateKey(endDate);

  const groupedTransactions: {
    date: string;
    transactions: { transaction: Transaction; date: string }[];
  }[] = [];

  const sortedDates = Object.keys(projections.transactionsOnDate).sort();
  for (const date of sortedDates) {
    if (date < startKey || date > endKey) continue;
    const transactionsOnDate = projections.transactionsOnDate[date] || [];
    groupedTransactions.push({
      date,
      transactions: transactionsOnDate.map((transaction) => ({ transaction, date })),
    });
  }

  return groupedTransactions;
};

// Get account balances for a date range (one entry per day, inclusive)
export const accountBalancesByDateRange = (
  projections: ProjectionsState,
  account    : Account,
  startDate  : string,
  endDate    : string
) => {
  const accountBalance = (projections.balanceByDateAndAccount || {})[account.id] || {};
  const balances: number[] = [];

  for (const dateKey of eachDateKey(anyToDateKey(startDate), anyToDateKey(endDate))) {
    balances.push(accountBalance[dateKey] || 0);
  }

  return balances;
};

/**
 * All of the day-panel figures in a single pass over the accounts.
 * `null` means "no account of that kind exists", which the panel uses to hide
 * the row entirely (a real $0 still renders).
 */
export interface DayFigures {
  spendingPower  : number;
  savings        : number | null;
  cash           : number | null;
  availableCredit: number | null;
  debt           : number | null;
  creditCardDebt : number | null;
  loanDebt       : number | null;
  netWorth       : number | null;
}

export const computeDayFigures = (
  projections: ProjectionsState,
  accounts   : Account[],
  date       : string | Date
): DayFigures => {
  let spendingPower = 0;
  let savings        : number | null = null;
  let cash           : number | null = null;
  let availableCredit: number | null = null;
  let debt           : number | null = null;
  let creditCardDebt : number | null = null;
  let loanDebt       : number | null = null;

  for (const account of accounts) {
    const balance = accountBalanceOnDate(projections, account.id, date);

    if (account.type === AccountType.CREDIT_CARD && account.creditLimit) {
      const available = account.creditLimit - balance;
      availableCredit = (availableCredit ?? 0) + Math.max(0, available);
    }

    if (account.type === AccountType.LOAN) {
      loanDebt = (loanDebt ?? 0) + balance;
    }

    if (!account.isSpendingPower) continue;

    switch (account.type) {
      case AccountType.CHECKING:
      case AccountType.CASH:
        cash = (cash ?? 0) + balance;
        spendingPower += balance;
        break;
      case AccountType.SAVINGS:
        savings = (savings ?? 0) + balance;
        spendingPower += balance;
        break;
      case AccountType.CREDIT_CARD: {
        if (account.creditLimit) {
          spendingPower += Math.max(0, account.creditLimit - balance);
        }
        creditCardDebt = (creditCardDebt ?? 0) + balance;
        debt = (debt ?? 0) + balance;
        break;
      }
      case AccountType.LOAN:
        debt = (debt ?? 0) + balance;
        break;
      default:
        break;
    }
  }

  const netWorth =
    savings !== null && cash !== null && debt !== null
      ? savings + cash - debt
      : null;

  return { spendingPower, savings, cash, availableCredit, debt, creditCardDebt, loanDebt, netWorth };
};

// Get account messages
interface Message {
  accountId: string;
  type     : string;
  date     : string;
  account  : Account;
}

export const getAccountMessages = (
  projections: ProjectionsState,
  account   ?: Account
): Message[] => {
  const messages: Message[] = [];

  if (!projections.accountMessages || Object.keys(projections.accountMessages).length === 0) {
    return messages;
  }

  const collect = (accountId: string) => {
    for (const message of projections.accountMessages[accountId] || []) {
      messages.push({ accountId, type: message.type, date: message.date, account: message.account });
    }
  };

  if (account) {
    collect(account.id);
  } else {
    for (const accountId in projections.accountMessages) {
      collect(accountId);
    }
  }

  return messages;
};

// Get Transactions By Account
export const getTransactionsByAccount = (
  projections: ProjectionsState,
  accountId ?: string
) => {
  if (accountId) {
    return projections.transactionsByAccount[accountId] || [];
  }
  return Object.values(projections.transactionsByAccount).flat();
};

// Get floating (past-due, uncleared) transaction occurrences
export const getFloatingTransactions = (projections: ProjectionsState) => {
  return projections.floatingTransactions || [];
};

// Get Spend By Transactions
export const getSpendByTransaction = (
  projections  : ProjectionsState,
  transactionId: string
) => {
  return projections.spendByTransaction[transactionId] || undefined;
};

export default projectionsSlice.reducer;

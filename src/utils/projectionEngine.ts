import { RRule, RRuleSet } from 'rrule';
import { differenceInDays, parseISO } from 'date-fns';

import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { AccountType, TransactionType } from './constants';
import {
  DateKey,
  addDaysToKey,
  daysBetweenKeys,
  eachDateKey,
  fromDateKey,
  toDateKey,
  utcMidnight,
  utcToDateKey,
} from './dateKey';

/**
 * Pure projection engine. No wall clock, no module state: callers supply the
 * window (`startKey`..`endKey`, both inclusive local DateKeys) and get back a
 * complete result. The Redux slice is a thin wrapper around `runProjection`;
 * tests drive these functions directly with a frozen "today".
 *
 * All money values are integer cents.
 */

export interface AccountMessage {
  date: string;
  type: string;
  account: Account;
}

/** A past-due occurrence of an autoClear:false transaction. */
export interface FloatingOccurrence {
  transaction: Transaction;
  /** The occurrence's original (past) DateKey. */
  date: DateKey;
}

export interface ProjectionResult {
  transactionsOnDate: Record<DateKey, Transaction[]>;
  balanceByDateAndAccount: Record<string, Record<DateKey, number>>;
  categorySpend: Record<string, number>;
  accountMessages: Record<string, AccountMessage[]>;
  transactionsByAccount: Record<string, Transaction[]>;
  spendByTransaction: Record<string, number>;
  floatingTransactions: FloatingOccurrence[];
}

export interface ProjectionInput {
  accounts: Account[];
  transactions: Transaction[];
  /** First projected day, normally "today". Day 1 starts from currentBalance. */
  startKey: DateKey;
  /** Last projected day (inclusive), normally farDate. */
  endKey: DateKey;
}

/** Hard ceiling (~30 years) so a malformed farDate can't run away. */
export const MAX_PROJECTION_DAYS = 11000;

/** How far out spend totals (categorySpend / spendByTransaction) accumulate. */
const SPEND_WINDOW_YEARS = 3;

/**
 * Discovery window for floating occurrences (~6 months). Occurrences already
 * recorded in transaction.pendingDates are kept regardless of this window —
 * once seen, a past-due item never silently expires.
 */
export const FLOATING_LOOKBACK_DAYS = 183;

interface SerializedRRuleSet {
  rrule: string | null;
  rdates: string[];
}

/**
 * transaction.rrule is a JSON envelope written by createRRule:
 * `{"rrule": "DTSTART...RRULE:..." | null, "rdates": [isoString...]}`.
 * Treat anything unparseable as "no recurrence" instead of crashing the
 * projection (a single bad transaction used to take down the whole reducer).
 */
export function parseSerializedRRule(raw: unknown): SerializedRRuleSet | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return null;
    return {
      rrule: typeof parsed.rrule === 'string' && parsed.rrule !== '' ? parsed.rrule : null,
      rdates: Array.isArray(parsed.rdates) ? parsed.rdates.map(String) : [],
    };
  } catch {
    return null;
  }
}

/**
 * Every DateKey on which a transaction occurs within [startKey, endKey],
 * exdates removed, deduplicated.
 *
 * RRule occurrences and rdates are floating UTC-midnight instants, so the
 * window is expressed the same way and occurrences are read back with
 * utcToDateKey. `inc=true` keeps both endpoints: a transaction scheduled for
 * today belongs to today's projection regardless of the time of day the
 * projection runs (the old `now + 12h` window dropped today always and
 * tomorrow for most of the day).
 */
export function expandTransactionOccurrences(
  transaction: Transaction,
  startKey: DateKey,
  endKey: DateKey
): DateKey[] {
  const serialized = parseSerializedRRule(transaction.rrule);
  const exdateKeys = new Set(
    (transaction.exdates ?? []).map((d) => String(d).slice(0, 10))
  );

  const keys = new Set<DateKey>();

  if (serialized && (serialized.rrule || serialized.rdates.length > 0)) {
    const rruleSet = new RRuleSet();
    if (serialized.rrule) {
      const rule = RRule.fromString(serialized.rrule);
      rruleSet.rrule(new RRule(rule.origOptions));
    }
    for (const iso of serialized.rdates) {
      rruleSet.rdate(utcMidnight(String(iso).slice(0, 10)));
    }
    const occurrences = rruleSet.between(utcMidnight(startKey), utcMidnight(endKey), true);
    for (const occurrence of occurrences) {
      keys.add(utcToDateKey(occurrence));
    }
  } else if (transaction.start_date) {
    // One-time transaction (or unusable recurrence data): single occurrence.
    const key = String(transaction.start_date).slice(0, 10);
    if (key >= startKey && key <= endKey) {
      keys.add(key);
    }
  }

  for (const ex of exdateKeys) {
    keys.delete(ex);
  }

  return Array.from(keys);
}

/**
 * Past-due occurrences of autoClear:false transactions: everything in the
 * discovery window [startKey − FLOATING_LOOKBACK_DAYS, startKey − 1], unioned
 * with the transaction's recorded pendingDates (pin-until-cleared), minus
 * clearedDates and exdates. Strictly before startKey — occurrences dated
 * today belong to the normal projection window, so nothing double-counts.
 */
export function expandFloatingOccurrences(
  transactions: Transaction[],
  startKey: DateKey
): FloatingOccurrence[] {
  const floating: FloatingOccurrence[] = [];
  const windowStart = addDaysToKey(startKey, -FLOATING_LOOKBACK_DAYS);
  const windowEnd = addDaysToKey(startKey, -1);

  for (const transaction of transactions) {
    if (transaction.autoClear !== false) continue;

    const cleared = new Set((transaction.clearedDates ?? []).map((d) => String(d).slice(0, 10)));
    const exdated = new Set((transaction.exdates ?? []).map((d) => String(d).slice(0, 10)));

    // exdates are already filtered by expandTransactionOccurrences; the set
    // here also guards recorded pendingDates that were later exdated away.
    const keys = new Set(expandTransactionOccurrences(transaction, windowStart, windowEnd));
    for (const recorded of transaction.pendingDates ?? []) {
      const key = String(recorded).slice(0, 10);
      if (key < startKey) keys.add(key);
    }

    for (const key of keys) {
      if (cleared.has(key) || exdated.has(key)) continue;
      floating.push({ transaction, date: key });
    }
  }

  floating.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return floating;
}

/**
 * Floating occurrences not yet recorded on their transaction's pendingDates.
 * The app dispatches these into the transactions slice after each recalc so
 * a seen occurrence survives past the discovery window (and converges: the
 * second pass finds nothing new).
 */
export function findUnrecordedPending(
  floating: FloatingOccurrence[]
): { event_id: string; dates: DateKey[] }[] {
  const byEvent = new Map<string, { recorded: Set<string>; dates: DateKey[] }>();

  for (const occurrence of floating) {
    const eventId = occurrence.transaction.event_id;
    let entry = byEvent.get(eventId);
    if (!entry) {
      entry = {
        recorded: new Set((occurrence.transaction.pendingDates ?? []).map((d) => String(d).slice(0, 10))),
        dates: [],
      };
      byEvent.set(eventId, entry);
    }
    if (!entry.recorded.has(occurrence.date)) {
      entry.dates.push(occurrence.date);
    }
  }

  const unrecorded: { event_id: string; dates: DateKey[] }[] = [];
  byEvent.forEach((entry, event_id) => {
    if (entry.dates.length > 0) unrecorded.push({ event_id, dates: entry.dates });
  });
  return unrecorded;
}

/** All transactions grouped by occurrence DateKey within the window. */
export function expandOccurrences(
  transactions: Transaction[],
  startKey: DateKey,
  endKey: DateKey
): Record<DateKey, Transaction[]> {
  const byDate: Record<DateKey, Transaction[]> = {};
  for (const transaction of transactions) {
    for (const key of expandTransactionOccurrences(transaction, startKey, endKey)) {
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(transaction);
    }
  }
  return byDate;
}

/**
 * Which accounts a transaction belongs to, for the per-account transaction
 * lists shown in the account panel.
 */
export function buildTransactionsByAccount(
  transactions: Transaction[]
): Record<string, Transaction[]> {
  const byAccount: Record<string, Transaction[]> = {};
  const add = (accountId: string | undefined, transaction: Transaction) => {
    if (!accountId) return;
    if (!byAccount[accountId]) byAccount[accountId] = [];
    byAccount[accountId].push(transaction);
  };
  for (const transaction of transactions) {
    if (transaction.type === TransactionType.DEPOSIT) {
      add(transaction.toAccount, transaction);
    } else if (transaction.type === TransactionType.WITHDRAWAL) {
      add(transaction.fromAccount, transaction);
    } else if (transaction.type === TransactionType.TRANSFER) {
      add(transaction.fromAccount, transaction);
      add(transaction.toAccount, transaction);
    }
  }
  return byAccount;
}

/**
 * Interest for one accrual on the given balance, in rounded cents.
 * savings / credit card / loan accrue daily (rate/365 of the annual rate);
 * mortgages accrue monthly (rate/12) on their due date — the standard US
 * mortgage convention. interestRate is a percentage (5.5 means 5.5%) and is
 * coerced because legacy data may hold it as a string.
 */
export function calculateInterestCents(account: Account, balanceCents: number): number {
  const rate = Number(account.interestRate);
  if (!rate || !isFinite(rate) || rate <= 0) return 0;
  switch (account.type) {
    case AccountType.SAVINGS:
    case AccountType.CREDIT_CARD:
    case AccountType.LOAN:
      return Math.round(balanceCents * (rate / 100 / 365));
    case AccountType.MORTGAGE:
      return Math.round(balanceCents * (rate / 100 / 12));
    default:
      return 0;
  }
}

/** Does interest accrue for this account on this day? */
export function isInterestDue(account: Account, dateKey: DateKey): boolean {
  switch (account.type) {
    case AccountType.SAVINGS:
    case AccountType.CREDIT_CARD:
    case AccountType.LOAN:
      return true;
    case AccountType.MORTGAGE: {
      const date = fromDateKey(dateKey);
      const dayOfMonth = date.getDate();
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      let dueDay = 1;
      if (account.dueDate) {
        const parsed = Number(String(account.dueDate).slice(8, 10));
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) dueDay = parsed;
      }
      // Due day past the end of a short month falls on the month's last day.
      return dayOfMonth === dueDay || (daysInMonth < dueDay && dayOfMonth === daysInMonth);
    }
    default:
      return false;
  }
}

export function runProjection(input: ProjectionInput): ProjectionResult {
  const { accounts, transactions } = input;
  const startKey = input.startKey;
  let endKey = input.endKey;

  if (endKey < startKey) endKey = startKey;
  if (daysBetweenKeys(startKey, endKey) + 1 > MAX_PROJECTION_DAYS) {
    endKey = addDaysToKey(startKey, MAX_PROJECTION_DAYS - 1);
  }

  const transactionsOnDate = expandOccurrences(transactions, startKey, endKey);
  const floatingTransactions = expandFloatingOccurrences(transactions, startKey);
  const transactionsByAccount = buildTransactionsByAccount(transactions);
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const balances: Record<string, Record<DateKey, number>> = {};
  const accountMessages: Record<string, AccountMessage[]> = {};
  const categorySpend: Record<string, number> = {};
  const spendByTransaction: Record<string, number> = {};

  const startDate = fromDateKey(startKey);
  const spendEnd = fromDateKey(startKey);
  spendEnd.setFullYear(spendEnd.getFullYear() + SPEND_WINDOW_YEARS);
  const spendEndKey = toDateKey(spendEnd);

  const addMessage = (accountId: string, date: string, type: string, account: Account) => {
    if (!accountMessages[accountId]) accountMessages[accountId] = [];
    const typeExists = accountMessages[accountId].some((m) => m.type === type);
    const isSnoozed = account.snoozedMessages?.some(
      (snoozed) =>
        snoozed.messageType === type &&
        differenceInDays(startDate, parseISO(snoozed.date)) < 7
    );
    if (!typeExists && !isSnoozed) {
      accountMessages[accountId].push({ date, type, account });
    }
  };

  // Stale-account notices are about "now", not a projected day.
  for (const account of accounts) {
    if (account.notifyOnAccountStale && account.lastUpdated) {
      const last = parseISO(account.lastUpdated);
      const staleAfter = new Date(last);
      staleAfter.setMonth(staleAfter.getMonth() + 1);
      if (staleAfter < startDate) {
        addMessage(account.id, startKey, 'accountStale', account);
      }
    }
    balances[account.id] = {};
  }

  const tallySpend = (transaction: Transaction, dateKey: DateKey) => {
    if (dateKey > spendEndKey) return;
    const amount = Math.abs(transaction.amount);
    spendByTransaction[transaction.event_id] =
      (spendByTransaction[transaction.event_id] || 0) + amount;
    // Deposits are income; they don't belong in spending categories.
    if (transaction.type !== 'deposit') {
      const category = transaction.category || 'Uncategorized';
      categorySpend[category] = (categorySpend[category] || 0) + amount;
    }
  };

  const applyTransfer = (transaction: Transaction, dateKey: DateKey) => {
    const toAccount = accountById.get(transaction.toAccount || '');
    const fromAccount = accountById.get(transaction.fromAccount || '');
    if (!toAccount || !fromAccount) return;

    let transferAmount = transaction.amount;
    const toBalance = balances[toAccount.id][dateKey];

    if (toAccount.isLiability) {
      if (
        transaction.amount > toBalance &&
        toAccount.notifyOnAccountPayoff &&
        (toAccount.type === AccountType.LOAN ||
          toAccount.type === AccountType.CREDIT_CARD ||
          toAccount.type === AccountType.MORTGAGE)
      ) {
        addMessage(toAccount.id, dateKey, 'accountPayoff', toAccount);
      }
      // Payments cap at the amount owed (overpayment is a future feature).
      transferAmount = Math.min(transaction.amount, toBalance);
    }

    tallySpend(transaction, dateKey);
    balances[toAccount.id][dateKey] += transferAmount * (toAccount.isLiability ? -1 : 1);
    balances[fromAccount.id][dateKey] += transferAmount * (fromAccount.isLiability ? 1 : -1);
  };

  const applyWithdrawal = (transaction: Transaction, dateKey: DateKey) => {
    const fromAccount = accountById.get(transaction.fromAccount || '');
    if (!fromAccount) return;

    tallySpend(transaction, dateKey);

    if (fromAccount.isLiability) {
      if (
        fromAccount.creditLimit &&
        transaction.amount > fromAccount.creditLimit - balances[fromAccount.id][dateKey] &&
        fromAccount.notifyOnAccountOverCredit &&
        fromAccount.type === AccountType.CREDIT_CARD
      ) {
        addMessage(fromAccount.id, dateKey, 'accountOverCredit', fromAccount);
      }
      balances[fromAccount.id][dateKey] += transaction.amount;
    } else {
      if (
        transaction.amount > balances[fromAccount.id][dateKey] &&
        fromAccount.notifyOnAccountOverDraft &&
        (fromAccount.type === AccountType.CHECKING ||
          fromAccount.type === AccountType.SAVINGS ||
          fromAccount.type === AccountType.CASH)
      ) {
        addMessage(fromAccount.id, dateKey, 'accountOverdraft', fromAccount);
      }
      balances[fromAccount.id][dateKey] -= transaction.amount;
    }
  };

  const applyDeposit = (transaction: Transaction, dateKey: DateKey) => {
    const toAccount = accountById.get(transaction.toAccount || '');
    if (!toAccount) return;
    tallySpend(transaction, dateKey);
    balances[toAccount.id][dateKey] += transaction.amount * (toAccount.isLiability ? -1 : 1);
  };

  let prevKey: DateKey | null = null;
  for (const dateKey of eachDateKey(startKey, endKey)) {
    // Open the day: carry forward yesterday's close (or the account's current
    // balance on day one), then accrue interest on the OPENING balance before
    // any of the day's transactions apply — interest is owed on what you held,
    // not on what's left after the payment.
    for (const account of accounts) {
      const opening =
        prevKey === null ? account.currentBalance : balances[account.id][prevKey];
      let balance = opening;
      if (balance > 0 && isInterestDue(account, dateKey)) {
        balance += calculateInterestCents(account, balance);
      }
      balances[account.id][dateKey] = balance;
    }

    const applyTransaction = (transaction: Transaction) => {
      if (transaction.type === TransactionType.TRANSFER) applyTransfer(transaction, dateKey);
      else if (transaction.type === TransactionType.WITHDRAWAL) applyWithdrawal(transaction, dateKey);
      else if (transaction.type === TransactionType.DEPOSIT) applyDeposit(transaction, dateKey);
    };

    // Floating (past-due, uncleared) occurrences land on the first projected
    // day: the money hasn't moved yet, so it moves "now" — oldest first,
    // ahead of the day's scheduled transactions.
    if (dateKey === startKey) {
      for (const occurrence of floatingTransactions) {
        applyTransaction(occurrence.transaction);
      }
    }

    const todaysTransactions = transactionsOnDate[dateKey];
    if (todaysTransactions) {
      for (const transaction of todaysTransactions) {
        applyTransaction(transaction);
      }
    }

    prevKey = dateKey;
  }

  return {
    transactionsOnDate,
    balanceByDateAndAccount: balances,
    categorySpend,
    accountMessages,
    transactionsByAccount,
    spendByTransaction,
    floatingTransactions,
  };
}

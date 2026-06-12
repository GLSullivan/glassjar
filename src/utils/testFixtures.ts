import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { AccountType, RecurrenceFrequency, TransactionType } from './constants';
import { createRRule } from './createRRule';

/**
 * Synthetic test data builders. Never put real financial data here.
 * Notification flags default OFF so message assertions are explicit.
 */

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id            : nextId('account'),
    name          : 'Test Account',
    currentBalance: 0,
    type          : AccountType.CHECKING,
    isLiability   : false,
    lastUpdated   : new Date().toISOString(),
    showInGraph   : true,
    color         : 0,
    isSpendingPower          : true,
    notifyOnAccountStale     : false,
    notifyOnAccountOverDraft : false,
    notifyOnAccountOverCredit: false,
    notifyOnAccountPayoff    : false,
    ...overrides,
  };
}

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  const base: Transaction = {
    transactionName   : 'Test Transaction',
    type              : TransactionType.WITHDRAWAL,
    amount            : 1000,
    event_id          : nextId('transaction'),
    description       : '',
    isRecurring       : false,
    recurrenceInterval: 1,
    start_date        : '2026-01-15',
    rrule             : '',
    givenDays         : [],
    showInCalendar    : true,
    ...overrides,
  };
  // Serialize the recurrence exactly the way the app does.
  let rrule = base.rrule;
  createRRule(base, (serialized) => {
    rrule = serialized;
  });
  return { ...base, rrule };
}

/** Shorthand for a recurring transaction with a given frequency. */
export function makeRecurring(
  frequency: RecurrenceFrequency,
  overrides: Partial<Transaction> = {}
): Transaction {
  return makeTransaction({
    isRecurring        : true,
    recurrenceFrequency: frequency,
    ...overrides,
  });
}

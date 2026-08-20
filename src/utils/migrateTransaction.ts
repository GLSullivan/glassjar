import { format, parseISO } from 'date-fns';

import { Transaction } from '../models/Transaction';
import { RecurrenceFrequency } from './constants';
import { createRRule } from './createRRule';

/**
 * Upgrades one raw Firebase transaction record to the current schema and
 * regenerates its rrule envelope. Extracted from the load path in store.tsx
 * so the exact production migration is unit-testable. Idempotent: running it
 * on an already-migrated record changes nothing.
 *
 * Legacy shapes handled:
 * - `date`/`endDate` (pre-2023-10) become `start_date`/`end_date`
 * - records with no `event_id` (pre-2023-10) get a stable one derived from
 *   the old numeric `id`, so editing and occurrence-clearing key correctly
 * - holiday-helper records saved as YEARLY but carrying a list of true
 *   moving-holiday dates in `arbitraryDates` become ARBITRARY, so the money
 *   lands on the real holiday (e.g. the actual Thanksgiving) instead of a
 *   fixed start-date anniversary
 */
export function migrateTransaction(raw: any): Transaction {
  const transaction: any = { ...raw };

  if (transaction.date) {
    transaction.start_date = format(parseISO(transaction.date), 'yyyy-MM-dd');
  }
  if (!transaction.end_date && transaction.endDate) {
    transaction.end_date = format(parseISO(transaction.endDate), 'yyyy-MM-dd');
  }

  delete transaction.date;
  delete transaction.endDate;
  delete transaction.rruleSet;
  delete transaction.allowOverpayment;

  if (transaction.event_id === undefined || transaction.event_id === null) {
    transaction.event_id = String(transaction.id ?? `legacy-${transaction.start_date}-${transaction.transactionName}`);
  }

  if (
    transaction.isRecurring &&
    transaction.recurrenceFrequency === RecurrenceFrequency.YEARLY &&
    Array.isArray(transaction.arbitraryDates) &&
    transaction.arbitraryDates.length > 1
  ) {
    transaction.recurrenceFrequency = RecurrenceFrequency.ARBITRARY;
  }

  createRRule(transaction as Transaction, (newRule) => {
    transaction.rrule = newRule;
  });

  return transaction as Transaction;
}

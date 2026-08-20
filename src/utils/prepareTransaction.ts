import { format, parseISO } from 'date-fns';

import { Transaction } from '../models/Transaction';
import { RecurrenceFrequency } from './constants';
import { createRRule } from './createRRule';

/**
 * Canonicalizes a transaction on its way into the store and regenerates the
 * rrule envelope from the structured fields. Every write path (add, update,
 * bulk update) funnels through here, so no form can save a transaction whose
 * envelope disagrees with its fields — the class of stale-metadata
 * contradictions the 2026-08 audit found (orphaned intervals, orphaned end
 * dates, empty envelopes from the mini forms) can no longer be created.
 *
 * Date fields normalize to the LOCAL calendar day ('yyyy-MM-dd') — the same
 * day the date input displayed — so a transaction created in the evening no
 * longer drifts one day forward through toISOString's UTC conversion.
 */

/** Local calendar day for either a 'yyyy-MM-dd' string or a full ISO instant. */
function toLocalDay(value: string): string {
  if (!value) return value;
  if (!value.includes('T')) return value.slice(0, 10);
  return format(parseISO(value), 'yyyy-MM-dd');
}

export function prepareTransaction(input: Transaction): Transaction {
  const transaction: Transaction = { ...input };

  transaction.start_date = toLocalDay(transaction.start_date);

  const interval = Math.round(Number(transaction.recurrenceInterval));
  transaction.recurrenceInterval =
    transaction.recurrenceFrequency === RecurrenceFrequency.CUSTOM && isFinite(interval) && interval > 0
      ? interval
      : 1;

  if (transaction.ends && transaction.end_date) {
    transaction.end_date = toLocalDay(transaction.end_date);
  } else {
    transaction.end_date = '';
  }

  if (transaction.recurrenceFrequency !== RecurrenceFrequency.ARBITRARY) {
    transaction.arbitraryDates = [];
  }

  createRRule(transaction, (newRule) => {
    transaction.rrule = newRule;
  });

  return transaction;
}

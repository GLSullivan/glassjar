import { expandTransactionOccurrences } from './projectionEngine';
import { makeRecurring, makeTransaction } from './testFixtures';
import { RecurrenceFrequency } from './constants';

/**
 * createRRule is tested through expandTransactionOccurrences so the assertions
 * cover the same serialize → parse → expand path the app uses.
 */

const expand = (transaction: ReturnType<typeof makeTransaction>, start: string, end: string) =>
  expandTransactionOccurrences(transaction, start, end).sort();

describe('monthly recurrence day-of-month handling', () => {
  test('a bill on the 1st recurs on the 1st (not month-end)', () => {
    const transaction = makeRecurring(RecurrenceFrequency.MONTHLY, { start_date: '2026-01-01' });
    expect(expand(transaction, '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01',
    ]);
  });

  test('a bill on the 31st falls back to the last day of short months', () => {
    const transaction = makeRecurring(RecurrenceFrequency.MONTHLY, { start_date: '2026-01-31' });
    expect(expand(transaction, '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30',
    ]);
  });

  test('a bill on the 30th stays on the 30th in long months (not the 31st)', () => {
    const transaction = makeRecurring(RecurrenceFrequency.MONTHLY, { start_date: '2026-01-30' });
    expect(expand(transaction, '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-30', '2026-02-28', '2026-03-30', '2026-04-30',
    ]);
  });

  test('a bill on the 29th stays on the 29th except in February', () => {
    const transaction = makeRecurring(RecurrenceFrequency.MONTHLY, { start_date: '2026-01-29' });
    expect(expand(transaction, '2026-01-01', '2026-04-30')).toEqual([
      '2026-01-29', '2026-02-28', '2026-03-29', '2026-04-29',
    ]);
  });

  test('leap-year February keeps the 29th', () => {
    const transaction = makeRecurring(RecurrenceFrequency.MONTHLY, { start_date: '2028-01-29' });
    expect(expand(transaction, '2028-01-01', '2028-03-31')).toEqual([
      '2028-01-29', '2028-02-29', '2028-03-29',
    ]);
  });
});

describe('twice-monthly recurrence', () => {
  test('starting on the 15th pays on the 15th and the 1st', () => {
    const transaction = makeRecurring(RecurrenceFrequency.TWICE_MONTHLY, { start_date: '2026-01-15' });
    expect(expand(transaction, '2026-01-15', '2026-03-15')).toEqual([
      '2026-01-15', '2026-02-01', '2026-02-15', '2026-03-01', '2026-03-15',
    ]);
  });

  test('starting on the 30th keeps both dates in short months (16th + last day)', () => {
    const transaction = makeRecurring(RecurrenceFrequency.TWICE_MONTHLY, { start_date: '2026-01-30' });
    expect(expand(transaction, '2026-01-30', '2026-03-31')).toEqual([
      '2026-01-30', '2026-02-16', '2026-02-28', '2026-03-16', '2026-03-30',
    ]);
  });
});

describe('other frequencies', () => {
  test('weekly recurs every 7 days', () => {
    const transaction = makeRecurring(RecurrenceFrequency.WEEKLY, { start_date: '2026-01-05' });
    expect(expand(transaction, '2026-01-05', '2026-01-26')).toEqual([
      '2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26',
    ]);
  });

  test('yearly recurs on the same date', () => {
    const transaction = makeRecurring(RecurrenceFrequency.YEARLY, { start_date: '2026-03-15' });
    expect(expand(transaction, '2026-01-01', '2028-12-31')).toEqual([
      '2026-03-15', '2027-03-15', '2028-03-15',
    ]);
  });

  test('end date stops the recurrence (inclusive)', () => {
    const transaction = makeRecurring(RecurrenceFrequency.MONTHLY, {
      start_date: '2026-01-10', end_date: '2026-03-10', ends: true,
    });
    expect(expand(transaction, '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-10', '2026-02-10', '2026-03-10',
    ]);
  });

  test('arbitrary dates expand to exactly those dates', () => {
    const transaction = makeRecurring(RecurrenceFrequency.ARBITRARY, {
      start_date: '2026-01-10',
      arbitraryDates: ['2026-02-03', '2026-05-27'],
    });
    expect(expand(transaction, '2026-01-01', '2026-12-31')).toEqual([
      '2026-01-10', '2026-02-03', '2026-05-27',
    ]);
  });

  test('an unknown frequency serializes as non-recurring instead of leaving rrule undefined', () => {
    const transaction = makeRecurring('nonsense' as RecurrenceFrequency, { start_date: '2026-01-10' });
    expect(typeof transaction.rrule).toBe('string');
    expect(expand(transaction, '2026-01-01', '2026-12-31')).toEqual(['2026-01-10']);
  });
});

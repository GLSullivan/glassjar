import { expandTransactionOccurrences } from './projectionEngine';
import { makeRecurring, makeTransaction } from './testFixtures';
import { RecurrenceFrequency, CustomIntervalType } from './constants';

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

  test('yearly anchored to Feb 29 fires every year (Feb 28 in non-leap years)', () => {
    const transaction = makeRecurring(RecurrenceFrequency.YEARLY, { start_date: '2024-02-29' });
    expect(expand(transaction, '2024-01-01', '2028-12-31')).toEqual([
      '2024-02-29', '2025-02-28', '2026-02-28', '2027-02-28', '2028-02-29',
    ]);
  });

  test('custom missing customIntervalType degrades to one-time (not a crash)', () => {
    const transaction = makeRecurring(RecurrenceFrequency.CUSTOM, {
      start_date: '2026-01-15', recurrenceInterval: 2, customIntervalType: undefined,
    });
    expect(expand(transaction, '2026-01-01', '2026-12-31')).toEqual(['2026-01-15']);
  });
});

describe('given days weekday mapping', () => {
  // The form's day buttons are Sunday-first: index 0 = Sunday … 6 = Saturday.
  test('selecting Sunday fires on Sundays', () => {
    const transaction = makeRecurring(RecurrenceFrequency.GIVEN_DAYS, {
      start_date: '2026-01-05', givenDays: [0],
    });
    const keys = expand(transaction, '2026-01-05', '2026-01-18');
    expect(keys).toEqual(['2026-01-11', '2026-01-18']);
    keys.forEach((k) => expect(new Date(k + 'T00:00:00Z').getUTCDay()).toBe(0));
  });

  test('selecting Monday and Saturday fires on Mondays and Saturdays', () => {
    const transaction = makeRecurring(RecurrenceFrequency.GIVEN_DAYS, {
      start_date: '2026-01-05', givenDays: [1, 6],
    });
    const days = expand(transaction, '2026-01-05', '2026-01-11')
      .map((k) => new Date(k + 'T00:00:00Z').getUTCDay())
      .sort();
    expect(days).toEqual([1, 6]);
  });
});

describe('interval semantics (characterization — intentional behavior)', () => {
  test('non-custom frequencies ignore recurrenceInterval; save-path resets it to 1', () => {
    // If a future change makes base frequencies honor the interval, this
    // must be a conscious decision: production data holds confirmed-stale
    // intervals (audit 2026-08) that would silently change real projections.
    const transaction = makeRecurring(RecurrenceFrequency.MONTHLY, {
      start_date: '2026-01-15', recurrenceInterval: 3,
    });
    expect(transaction.recurrenceInterval).toBe(1);
    expect(expand(transaction, '2026-01-01', '2026-06-30')).toEqual([
      '2026-01-15', '2026-02-15', '2026-03-15', '2026-04-15', '2026-05-15', '2026-06-15',
    ]);
  });

  test('custom honors the interval for every unit', () => {
    const cases: Array<[CustomIntervalType, number, string[]]> = [
      [CustomIntervalType.WEEK, 2, ['2026-01-15', '2026-01-29', '2026-02-12', '2026-02-26', '2026-03-12', '2026-03-26']],
      [CustomIntervalType.MONTH, 2, ['2026-01-15', '2026-03-15']],
      [CustomIntervalType.DAY, 10, ['2026-01-15', '2026-01-25', '2026-02-04', '2026-02-14', '2026-02-24', '2026-03-06', '2026-03-16', '2026-03-26']],
    ];
    for (const [unit, interval, expected] of cases) {
      const transaction = makeRecurring(RecurrenceFrequency.CUSTOM, {
        start_date: '2026-01-15', recurrenceInterval: interval, customIntervalType: unit,
      });
      expect(expand(transaction, '2026-01-01', '2026-03-31')).toEqual(expected);
    }
  });
});

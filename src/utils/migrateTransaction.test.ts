import { describe, expect, test } from 'vitest';

import { migrateTransaction } from './migrateTransaction';
import { expandTransactionOccurrences } from './projectionEngine';

/**
 * The load-path migration is where three years of schema history meet the
 * current engine. These tests pin the legacy conversions and the 2026-08
 * holiday repair (yearly records carrying true moving-holiday dates in
 * arbitraryDates now fire on those dates).
 */

const expand = (t: any, start: string, end: string) =>
  expandTransactionOccurrences(t, start, end).sort();

describe('legacy schema conversion', () => {
  test('date/endDate become start_date/end_date and legacy fields are dropped', () => {
    const migrated: any = migrateTransaction({
      id: 1689883289986,
      transactionName: 'Rent',
      type: 'withdrawal',
      amount: 170080,
      date: '2023-07-28T07:00:00.000Z',
      endDate: '',
      isRecurring: true,
      recurrenceFrequency: 'monthly',
      allowOverpayment: false,
      showInCalendar: true,
    });
    expect(migrated.start_date).toBe('2023-07-28');
    expect(migrated.date).toBeUndefined();
    expect(migrated.endDate).toBeUndefined();
    expect(migrated.allowOverpayment).toBeUndefined();
    expect(expand(migrated, '2026-08-11', '2026-10-31')).toEqual([
      '2026-08-28', '2026-09-28', '2026-10-28',
    ]);
  });

  test('records without event_id get a stable one from the legacy id', () => {
    const migrated = migrateTransaction({
      id: 1689883289986,
      transactionName: 'Rent',
      type: 'withdrawal',
      amount: 1,
      date: '2023-07-28T07:00:00.000Z',
      isRecurring: false,
    });
    expect(migrated.event_id).toBe('1689883289986');
    // Stable across repeated loads — editing keys on event_id.
    expect(migrateTransaction({ ...migrated }).event_id).toBe('1689883289986');
  });

  test('migration is idempotent on current-schema records', () => {
    const record = {
      transactionName: 'Adobe Sub',
      event_id: '1685159113437',
      type: 'withdrawal',
      amount: 5499,
      isRecurring: true,
      recurrenceFrequency: 'monthly',
      recurrenceInterval: 1,
      start_date: '2023-05-11',
      givenDays: [],
      showInCalendar: true,
      rrule: '',
    };
    const once = migrateTransaction(record);
    const twice = migrateTransaction(once);
    expect(twice).toEqual(once);
  });
});

describe('holiday repair (yearly + multiple arbitraryDates -> arbitrary)', () => {
  const thanksgiving = {
    transactionName: 'Thanksgiving Day',
    event_id: '1687998089215',
    type: 'withdrawal',
    amount: 25000,
    isRecurring: true,
    recurrenceFrequency: 'yearly',
    start_date: '2024-11-22',
    arbitraryDates: [
      '2025-11-27', '2026-11-26', '2027-11-25', '2028-11-23',
      '2029-11-29', '2030-11-28', '2031-11-27', '2032-11-25',
    ],
    givenDays: [],
    showInCalendar: true,
    rrule: '',
  };

  test('fires on the true holiday dates instead of a fixed anniversary', () => {
    const migrated = migrateTransaction(thanksgiving);
    expect(migrated.recurrenceFrequency).toBe('arbitrary');
    // 2026's real Thanksgiving is Nov 26 — the fixed anniversary was Nov 22.
    expect(expand(migrated, '2026-08-11', '2027-12-31')).toEqual([
      '2026-11-26', '2027-11-25',
    ]);
  });

  test('a single stray arbitrary date does NOT convert (LACC Tuition shape)', () => {
    const migrated = migrateTransaction({
      transactionName: 'LACC Tuition',
      event_id: '1689436784923',
      type: 'withdrawal',
      amount: 29214,
      isRecurring: true,
      recurrenceFrequency: 'monthly',
      recurrenceInterval: '6',
      start_date: '2026-03-12',
      arbitraryDates: ['2024-01-15'],
      givenDays: [],
      showInCalendar: true,
      rrule: '',
    });
    expect(migrated.recurrenceFrequency).toBe('monthly');
    // Confirmed monthly intent: fires every month, stray fields inert.
    expect(expand(migrated, '2026-08-11', '2026-11-30')).toEqual([
      '2026-08-12', '2026-09-12', '2026-10-12', '2026-11-12',
    ]);
  });
});

describe('confirmed-stale metadata stays inert at load (characterization)', () => {
  test('monthly + recurrenceInterval 3 still fires every month (Flying)', () => {
    const migrated = migrateTransaction({
      transactionName: 'Flying',
      event_id: '1685458638447',
      type: 'withdrawal',
      amount: 25000,
      isRecurring: true,
      recurrenceFrequency: 'monthly',
      recurrenceInterval: 3,
      start_date: '2026-04-28',
      givenDays: [],
      showInCalendar: true,
      rrule: '',
    });
    expect(expand(migrated, '2026-08-11', '2026-11-30')).toEqual([
      '2026-08-28', '2026-09-28', '2026-10-28', '2026-11-28',
    ]);
  });

  test('end_date with ends:false still runs forever (StateFarm)', () => {
    const migrated = migrateTransaction({
      transactionName: 'StateFarm Insurance',
      event_id: '2023-12-22T00:49:21.838Z',
      type: 'withdrawal',
      amount: 21280,
      isRecurring: true,
      recurrenceFrequency: 'monthly',
      recurrenceInterval: 1,
      start_date: '2024-01-21T00:00:00-08:00',
      end_date: '2024-04-25',
      ends: false,
      givenDays: [],
      showInCalendar: true,
      rrule: '',
    });
    const keys = expand(migrated, '2026-08-11', '2026-12-31');
    expect(keys.length).toBe(5);
    expect(keys[0]).toBe('2026-08-21');
  });
});

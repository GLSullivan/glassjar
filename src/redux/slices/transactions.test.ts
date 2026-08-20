import { describe, expect, test } from 'vitest';

import reducer, {
  addTransaction,
  updateTransaction,
} from './transactions';
import { Transaction } from '../../models/Transaction';
import { RecurrenceFrequency, CustomIntervalType, TransactionType } from '../../utils/constants';
import { expandFloatingOccurrences, expandTransactionOccurrences } from '../../utils/projectionEngine';
import { addDaysToKey, toDateKey } from '../../utils/dateKey';

/**
 * The reducers are the single choke point where a transaction's rrule
 * envelope is (re)generated. These tests drive the exact payloads the forms
 * dispatch and assert on generated occurrence dates — the thing projections
 * actually consume.
 */

const expand = (t: Transaction, start: string, end: string) =>
  expandTransactionOccurrences(t, start, end).sort();

const emptyState = { transactions: [] as Transaction[], activeTransaction: null };

/** The exact shape MiniTransactionForm dispatches: rrule is an empty string. */
const miniFormPayload = (): Transaction => ({
  transactionName: 'Cable Bill',
  amount: 10000,
  start_date: '2026-09-01',
  type: TransactionType.WITHDRAWAL,
  description: '',
  fromAccount: 'acct-1',
  toAccount: '',
  event_id: 'mini-1',
  isRecurring: true,
  end_date: '',
  recurrenceFrequency: RecurrenceFrequency.MONTHLY,
  showInCalendar: true,
  category: 'None',
  rrule: '',
  recurrenceInterval: 1,
  givenDays: [],
});

describe('addTransaction regenerates the envelope (mini-form bug)', () => {
  test('a recurring transaction added with rrule:"" recurs immediately, not after reload', () => {
    const state = reducer(emptyState, addTransaction(miniFormPayload()));
    const saved = state.transactions[0];
    expect(saved.rrule).not.toBe('');
    expect(expand(saved, '2026-09-01', '2026-12-31')).toEqual([
      '2026-09-01', '2026-10-01', '2026-11-01', '2026-12-01',
    ]);
  });
});

describe('updateTransaction re-derives recurrence from the edited fields', () => {
  const base = (): Transaction => ({
    ...miniFormPayload(),
    event_id: 'edit-1',
    recurrenceFrequency: RecurrenceFrequency.CUSTOM,
    customIntervalType: CustomIntervalType.MONTH,
    recurrenceInterval: 1,
  });

  test('changing a custom interval 1 -> 3 changes generated dates', () => {
    let state = reducer(emptyState, addTransaction(base()));
    state = reducer(state, updateTransaction({ ...state.transactions[0], recurrenceInterval: 3 }));
    expect(expand(state.transactions[0], '2026-09-01', '2027-08-31')).toEqual([
      '2026-09-01', '2026-12-01', '2027-03-01', '2027-06-01',
    ]);
    expect(state.transactions[0].updatedAt).toBeGreaterThan(0);
  });

  test('string interval from the form input is coerced and honored', () => {
    let state = reducer(emptyState, addTransaction(base()));
    state = reducer(state, updateTransaction({
      ...state.transactions[0],
      recurrenceInterval: '2' as unknown as number,
    }));
    expect(state.transactions[0].recurrenceInterval).toBe(2);
    expect(expand(state.transactions[0], '2026-09-01', '2027-02-28')).toEqual([
      '2026-09-01', '2026-11-01', '2027-01-01',
    ]);
  });

  test('infinite -> finite -> infinite round trip', () => {
    let state = reducer(emptyState, addTransaction(miniFormPayload()));
    state = reducer(state, updateTransaction({
      ...state.transactions[0], ends: true, end_date: '2026-11-15',
    }));
    expect(expand(state.transactions[0], '2026-09-01', '2027-12-31')).toEqual([
      '2026-09-01', '2026-10-01', '2026-11-01',
    ]);
    state = reducer(state, updateTransaction({ ...state.transactions[0], ends: false }));
    // end_date is cleared with the flag: no orphaned end date can persist.
    expect(state.transactions[0].end_date).toBe('');
    expect(expand(state.transactions[0], '2026-09-01', '2027-02-28').length).toBe(6);
  });

  test('switching custom -> monthly resets the interval instead of orphaning it', () => {
    let state = reducer(emptyState, addTransaction({
      ...base(), recurrenceInterval: 4,
    }));
    state = reducer(state, updateTransaction({
      ...state.transactions[0],
      recurrenceFrequency: RecurrenceFrequency.MONTHLY,
    }));
    expect(state.transactions[0].recurrenceInterval).toBe(1);
    expect(expand(state.transactions[0], '2026-09-01', '2026-12-31').length).toBe(4);
  });
});

describe('date normalization on save', () => {
  test('a full-ISO start_date saves as the local calendar day the form displayed', () => {
    // 03:00Z is the previous evening in US timezones; the form displays the
    // local day, so that is the day that must project.
    const iso = '2026-08-12T03:00:00.000Z';
    const shownInForm = new Date(iso);
    const expected = `${shownInForm.getFullYear()}-${String(shownInForm.getMonth() + 1).padStart(2, '0')}-${String(shownInForm.getDate()).padStart(2, '0')}`;

    const state = reducer(emptyState, addTransaction({ ...miniFormPayload(), start_date: iso }));
    expect(state.transactions[0].start_date).toBe(expected);
    expect(expand(state.transactions[0], '2026-08-01', '2026-08-31')).toEqual([expected]);
  });

  test('a plain yyyy-MM-dd start_date is preserved verbatim', () => {
    const state = reducer(emptyState, addTransaction({ ...miniFormPayload(), start_date: '2026-09-01' }));
    expect(state.transactions[0].start_date).toBe('2026-09-01');
  });
});

describe('autoClear transition (UpWorthy bug)', () => {
  const todayKey = toDateKey(new Date());
  // A biweekly deposit that has been running for ~6 months.
  const runningDeposit = (): Transaction => ({
    ...miniFormPayload(),
    event_id: 'upworthy',
    type: TransactionType.DEPOSIT,
    toAccount: 'acct-1',
    recurrenceFrequency: RecurrenceFrequency.CUSTOM,
    customIntervalType: CustomIntervalType.WEEK,
    recurrenceInterval: 2,
    start_date: addDaysToKey(todayKey, -180),
    autoClear: true,
  });

  test('switching auto-clear OFF assumes all past occurrences are cleared', () => {
    let state = reducer(emptyState, addTransaction(runningDeposit()));
    state = reducer(state, updateTransaction({ ...state.transactions[0], autoClear: false }));
    const saved = state.transactions[0];

    // Every pre-today occurrence landed in clearedDates…
    const past = expandTransactionOccurrences(saved, saved.start_date, addDaysToKey(todayKey, -1));
    expect(past.length).toBeGreaterThan(10);
    expect(saved.clearedDates).toEqual(past);
    // …so nothing floats: the projection's day 1 is unaffected by history.
    expect(expandFloatingOccurrences([saved], todayKey)).toEqual([]);
  });

  test('occurrences after the flip still float as designed', () => {
    let state = reducer(emptyState, addTransaction(runningDeposit()));
    state = reducer(state, updateTransaction({ ...state.transactions[0], autoClear: false }));
    // A month later, occurrences between the flip and "today" are past due.
    const laterToday = addDaysToKey(todayKey, 30);
    const floating = expandFloatingOccurrences(state.transactions, laterToday);
    expect(floating.length).toBeGreaterThanOrEqual(2);
    floating.forEach((f) => expect(f.date >= todayKey).toBe(true));
  });

  test('editing an already hand-clear transaction never re-clears its floating history', () => {
    let state = reducer(emptyState, addTransaction(runningDeposit()));
    state = reducer(state, updateTransaction({ ...state.transactions[0], autoClear: false }));
    const clearedAtFlip = state.transactions[0].clearedDates ?? [];
    // Later edit (amount change) while already autoClear:false — no transition.
    state = reducer(state, updateTransaction({ ...state.transactions[0], amount: 999 }));
    expect(state.transactions[0].clearedDates).toEqual(clearedAtFlip);
  });

  test('a transaction CREATED with autoClear:false keeps floating history (backdated check)', () => {
    const state = reducer(emptyState, addTransaction({
      ...miniFormPayload(),
      event_id: 'old-check',
      isRecurring: false,
      start_date: addDaysToKey(todayKey, -20),
      autoClear: false,
    }));
    const floating = expandFloatingOccurrences(state.transactions, todayKey);
    expect(floating.map((f) => f.date)).toEqual([addDaysToKey(todayKey, -20)]);
  });

  test('flip ON then OFF again re-seeds the interim period', () => {
    let state = reducer(emptyState, addTransaction(runningDeposit()));
    state = reducer(state, updateTransaction({ ...state.transactions[0], autoClear: false }));
    // Simulate the app having recorded pending occurrences before the fix.
    state = reducer(state, updateTransaction({
      ...state.transactions[0],
      autoClear: true,
      pendingDates: [addDaysToKey(todayKey, -30)],
      clearedDates: [],
    }));
    state = reducer(state, updateTransaction({ ...state.transactions[0], autoClear: false }));
    const saved = state.transactions[0];
    expect(saved.pendingDates).toEqual([]);
    expect(expandFloatingOccurrences([saved], todayKey)).toEqual([]);
  });
});

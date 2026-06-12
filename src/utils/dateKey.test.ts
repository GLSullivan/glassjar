import {
  addDaysToKey,
  anyToDateKey,
  daysBetweenKeys,
  eachDateKey,
  fromDateKey,
  toDateKey,
  utcMidnight,
  utcToDateKey,
} from './dateKey';

describe('dateKey', () => {
  test('toDateKey/fromDateKey round-trip', () => {
    expect(toDateKey(fromDateKey('2026-06-12'))).toBe('2026-06-12');
    expect(toDateKey(fromDateKey('2026-01-01'))).toBe('2026-01-01');
    expect(toDateKey(fromDateKey('2026-12-31'))).toBe('2026-12-31');
  });

  test('toDateKey pads months and days', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 10, 25))).toBe('2026-11-25');
  });

  test('utcToDateKey reads floating UTC-midnight instants', () => {
    expect(utcToDateKey(utcMidnight('2026-06-12'))).toBe('2026-06-12');
    expect(utcToDateKey(new Date(Date.UTC(2026, 2, 8)))).toBe('2026-03-08');
  });

  test('anyToDateKey handles plain keys, ISO strings, and Dates', () => {
    expect(anyToDateKey('2026-06-12')).toBe('2026-06-12');
    expect(anyToDateKey(new Date(2026, 5, 12, 23, 59))).toBe('2026-06-12');
    // Full ISO with offset: the local calendar date of that instant.
    const isoLocal = new Date(2026, 5, 12, 0, 0, 0).toISOString();
    expect(anyToDateKey(isoLocal)).toBe('2026-06-12');
  });

  test('addDaysToKey crosses month and year boundaries', () => {
    expect(addDaysToKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('daysBetweenKeys', () => {
    expect(daysBetweenKeys('2026-01-01', '2026-01-01')).toBe(0);
    expect(daysBetweenKeys('2026-01-01', '2026-01-31')).toBe(30);
    expect(daysBetweenKeys('2026-01-01', '2027-01-01')).toBe(365);
  });

  test('eachDateKey is inclusive of both endpoints', () => {
    const keys = Array.from(eachDateKey('2026-01-30', '2026-02-02'));
    expect(keys).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
  });

  test('eachDateKey crosses US DST boundaries without skips or duplicates', () => {
    // Spring forward 2026-03-08 and fall back 2026-11-01 (America/New_York).
    const spring = Array.from(eachDateKey('2026-03-07', '2026-03-10'));
    expect(spring).toEqual(['2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10']);

    const fall = Array.from(eachDateKey('2026-10-31', '2026-11-03'));
    expect(fall).toEqual(['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']);
  });

  test('daysBetweenKeys is calendar-day exact across DST', () => {
    expect(daysBetweenKeys('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetweenKeys('2026-10-31', '2026-11-02')).toBe(2);
  });
});

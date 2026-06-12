import { parseISO } from 'date-fns';

/**
 * A DateKey is a calendar date in the user's local timezone, formatted
 * 'yyyy-MM-dd'. It is the single canonical representation for projection
 * dates: every read and write of `balanceByDateAndAccount` /
 * `transactionsOnDate` goes through these helpers. String comparison of
 * DateKeys is chronological, which the engine relies on.
 */
export type DateKey = string;

/** Local-calendar DateKey for a Date instant. */
export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
}

/**
 * DateKey from a Date's UTC fields. RRule occurrences are "floating"
 * UTC-midnight instants whose UTC fields carry the intended calendar date —
 * reading them this way avoids the offset-shifting dance entirely and is
 * immune to DST.
 */
export function utcToDateKey(date: Date): DateKey {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return `${y}-${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
}

/** Local-midnight Date for a DateKey (or the date part of any ISO string). */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** UTC-midnight instant for a DateKey — the convention RRule occurrences use. */
export function utcMidnight(key: DateKey): Date {
  const [y, m, d] = key.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * DateKey from anything date-ish: a Date, a 'yyyy-MM-dd' string, or a full
 * ISO string (with or without offset). Strings parse via date-fns parseISO so
 * 'yyyy-MM-dd' means local midnight — never `new Date('yyyy-MM-dd')`, which
 * would read it as UTC and shift the calendar date in positive-offset zones.
 */
export function anyToDateKey(input: string | Date): DateKey {
  if (input instanceof Date) return toDateKey(input);
  const s = String(input);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return toDateKey(parseISO(s));
}

/** key + n days (n may be negative). */
export function addDaysToKey(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Whole days from startKey to endKey (0 when equal). */
export function daysBetweenKeys(startKey: DateKey, endKey: DateKey): number {
  const ms = utcMidnight(endKey).getTime() - utcMidnight(startKey).getTime();
  return Math.round(ms / 86400000);
}

/** Iterate DateKeys from start to end, both inclusive. */
export function* eachDateKey(startKey: DateKey, endKey: DateKey): Generator<DateKey> {
  const cursor = fromDateKey(startKey);
  const stop = fromDateKey(endKey);
  while (cursor <= stop) {
    yield toDateKey(cursor);
    cursor.setDate(cursor.getDate() + 1);
  }
}

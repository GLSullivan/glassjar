import { Transaction } from "../models/Transaction";
import { RecurrenceFrequency, CustomIntervalType } from "./constants";
import { RRule, RRuleSet, Options, Frequency } from 'rrule';

/**
 * Serializes a transaction's recurrence into the JSON envelope the projection
 * engine consumes: `{"rrule": string|null, "rdates": string[]}`.
 *
 * Dates here are "floating": start/end dates ('yyyy-MM-dd') parse to UTC
 * midnight and all day-of-month reads use the UTC fields. Reading local
 * fields off a UTC-midnight date shifts the day in most timezones (a bill on
 * the 1st would read as the 31st in the US).
 *
 * The callback is ALWAYS invoked — recurrence settings the function doesn't
 * understand serialize as non-recurring instead of leaving `rrule` undefined,
 * which used to crash the projection.
 */
export const createRRule = (transaction: Transaction, callback: (newRule: string) => void) => {

  let dtstartDate = new Date(transaction.start_date);
  let dtendDate = transaction.end_date ? new Date(transaction.end_date) : null;

  let options: Options = {
    dtstart: dtstartDate,
    until: dtendDate,
    freq: Frequency.YEARLY,
    interval: 1,
    wkst: null,
    count: null,
    tzid: null,
    bysetpos: null,
    bymonth: null,
    bymonthday: null,
    bynmonthday: null,
    byyearday: null,
    byweekno: null,
    byweekday: null,
    bynweekday: null,
    byhour: null,
    byminute: null,
    bysecond: null,
    byeaster: null
  };

  const rruleSet = new RRuleSet();
  let rruleString: string | null = null;
  let hasRule = false;

  if (transaction.recurrenceFrequency && transaction.isRecurring) {
    hasRule = true;
    const startDay = dtstartDate.getUTCDate();

    switch (transaction.recurrenceFrequency) {
      case RecurrenceFrequency.DAILY:
        options.freq = RRule.DAILY;
        break;
      case RecurrenceFrequency.WEEKLY:
        options.freq = RRule.WEEKLY;
        options.interval = 1;
        break;
      case RecurrenceFrequency.MONTHLY:
        if (startDay >= 29) {
          // Months without the start day fall back to their last day:
          // candidates run 28..startDay and bysetpos picks the latest that
          // exists. (A fixed 28..31 list made a bill on the 30th fire on
          // the 31st in long months.)
          const candidates: number[] = [];
          for (let day = 28; day <= startDay; day++) candidates.push(day);
          options.bymonthday = candidates;
          options.bysetpos = -1;
        }
        options.freq = RRule.MONTHLY;
        options.interval = 1;
        break;
      case RecurrenceFrequency.YEARLY:
        options.freq = RRule.YEARLY;
        options.interval = 1;
        break;
      case RecurrenceFrequency.GIVEN_DAYS:
        options.freq = RRule.WEEKLY;
        options.byweekday = transaction.givenDays || undefined;
        options.interval = 1;
        break;
      case RecurrenceFrequency.TWICE_MONTHLY:
        options.freq = RRule.MONTHLY;
        if (startDay <= 14) {
          options.bymonthday = [startDay, startDay + 14];
        } else if (startDay <= 28) {
          // Both dates exist in every month.
          options.bymonthday = [startDay - 14, startDay];
        } else {
          // The late date may not exist in short months (e.g. the 30th in
          // February); give it last-day fallback candidates and select the
          // early date plus the latest surviving late date.
          const lateCandidates: number[] = [];
          for (let day = 28; day <= startDay; day++) lateCandidates.push(day);
          options.bymonthday = [startDay - 14, ...lateCandidates];
          options.bysetpos = [1, -1];
        }
        break;
      case RecurrenceFrequency.CUSTOM:
        options.interval = transaction.recurrenceInterval;
        switch (transaction.customIntervalType) {
          case CustomIntervalType.DAY:
            options.freq = RRule.DAILY;
            break;
          case CustomIntervalType.WEEK:
            options.freq = RRule.WEEKLY;
            break;
          case CustomIntervalType.MONTH:
            options.freq = RRule.MONTHLY;
            break;
          case CustomIntervalType.YEAR:
            options.freq = RRule.YEARLY;
            break;
          default:
            hasRule = false;
        }
        break;
      case RecurrenceFrequency.ARBITRARY:
        hasRule = false;
        if (transaction.arbitraryDates) {
          rruleSet.rdate(new Date(transaction.start_date));
          transaction.arbitraryDates.forEach((date: string) => {
            rruleSet.rdate(new Date(date));
          });
        }
        break;
      default:
        hasRule = false;
    }

    // If end_date exists, include it in the RRULE options
    if (dtendDate && transaction.ends) {
      options.until = dtendDate;
    } else {
      options.until = null;
    }

    if (hasRule) {
      const rrule = new RRule(options);
      rruleString = rrule.toString();
      rruleSet.rrule(rrule);
    }
  }

  // Serialize to JSON-compatible structure
  const serializedSet = {
    rrule: rruleString,
    rdates: rruleSet.rdates().map(date => date.toISOString()),
  };

  callback(JSON.stringify(serializedSet));
}

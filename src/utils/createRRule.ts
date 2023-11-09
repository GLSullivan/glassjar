import { Transaction } from "../models/Transaction";
import { RecurrenceFrequency, CustomIntervalType } from "./constants";
import { RRule, RRuleSet, Options, Frequency } from 'rrule';

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

  if (transaction.recurrenceFrequency && transaction.isRecurring) {
    switch (transaction.recurrenceFrequency) {
      case RecurrenceFrequency.DAILY:
        options.freq = RRule.DAILY;
        break;
      case RecurrenceFrequency.WEEKLY:
        options.freq = RRule.WEEKLY;
        options.interval = 1;
        break;
      case RecurrenceFrequency.MONTHLY:
        if (dtstartDate.getDate() >= 29) {
          options.bymonthday = [28, 29, 30, 31]; // Potential month days
          options.bysetpos = -1; // Take the last valid one
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
        const initialDate = dtstartDate.getDate();
        if (initialDate <= 14) {
          options.bymonthday = [initialDate, initialDate + 14];
        } else {
          options.bymonthday = [initialDate, initialDate - 14];
        }
        break;
      case RecurrenceFrequency.CUSTOM:
        options.interval=  transaction.recurrenceInterval;
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
            return null;
          }
        break;
      case RecurrenceFrequency.ARBITRARY:
        if (transaction.arbitraryDates) {
          rruleSet.rdate(new Date(transaction.start_date));
          transaction.arbitraryDates.forEach((date: string) => {
            rruleSet.rdate(new Date(date));
          });
        }
        break;
      default:
        return null;
    } 
    
    // If end_date exists, include it in the RRULE options
    if (dtendDate && transaction.ends) {
      options.until = dtendDate;
    } else {
      options.until = null;
    }

    if (transaction.recurrenceFrequency !== RecurrenceFrequency.ARBITRARY) {
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
import { RecurrenceFrequency, TransactionType, CustomIntervalType } from './../utils/constants';

export interface Transaction {
  transactionName     : string;
  id                  : number; // UID. Time stamp at point of creation.
  type                : TransactionType;
  amount              : number; // All amounts are in whole cents
  date                : string;
  description         : string;
  isRecurring         : boolean;
  allowOverpayment    : boolean;
  showInCalendar      : boolean; // Future feature for omitting high-frequency events from the calendar.
  recurrenceFrequency?: RecurrenceFrequency;
  customIntervalType ?: CustomIntervalType;
  givenDays          ?: number[];
  recurrenceInterval ?: number;  
  endDate            ?: string;
  fromAccount        ?: string;
  toAccount          ?: string;
  updatedAt          ?: number;
  category           ?: string;
  skippedDates       ?: string[]; // Future feature for skipping instances of an event.
  arbitraryDates     ?: string[]; 
  discretionary      ?: boolean; // Future feature for sorting, showing things that are required.
  fromHelper         ?: string;
}
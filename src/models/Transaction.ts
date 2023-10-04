import { RecurrenceFrequency, TransactionType, CustomIntervalType } from './../utils/constants';

export interface Transaction {
  transactionName     : string;
  id                  : number; 
  type                : TransactionType;
  amount              : number; 
  date                : string;
  description         : string;
  isRecurring         : boolean;
  ends?               : boolean;
  allowOverpayment    : boolean; // This should be an account value, not a transaction value.
  showInCalendar      : boolean; // TODO: Future feature for omitting high-frequency events from the calendar.
  recurrenceFrequency?: RecurrenceFrequency;
  customIntervalType ?: CustomIntervalType;
  givenDays          ?: number[];
  recurrenceInterval ?: number;  
  endDate            ?: string;
  fromAccount        ?: string;
  toAccount          ?: string;
  updatedAt          ?: number;
  category           ?: string;
  skippedDates       ?: string[]; // TODO: Future feature for skipping instances of an event.
  arbitraryDates     ?: string[]; 
  discretionary      ?: boolean; // Future feature for sorting, showing things that are required.
  fromHelper         ?: string;
  nextOccurrence     ?: string;
  
}
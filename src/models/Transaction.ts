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
  showInCalendar      : boolean; 
  recurrenceFrequency?: RecurrenceFrequency;
  customIntervalType ?: CustomIntervalType;
  givenDays          ?: number[];
  recurrenceInterval ?: number;  
  endDate            ?: string;
  fromAccount        ?: string;
  toAccount          ?: string;
  updatedAt          ?: number;
  category           ?: string;
  discretionary      ?: boolean; // Future feature for sorting, showing things that are required.

  arbitraryDates     ?: string[]; 
  fromHelper         ?: string;
  
  autoClear          ?: boolean;
  clearedDates       ?: string[]; // TODO: Future feature for skipping instances of an event.
  
}
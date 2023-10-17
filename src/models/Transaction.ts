import { RecurrenceFrequency, TransactionType, CustomIntervalType } from './../utils/constants';

export interface Transaction {
  transactionName     : string;
  type                : TransactionType;
  amount              : number; 
  
  event_id            : string; 
  date                : string;
  description         : string;
  ends?               : boolean;
  endDate            ?: string;

  isRecurring         : boolean;
  recurrenceInterval ?: number;  
  recurrenceFrequency?: RecurrenceFrequency;
  showInCalendar      : boolean; 
  customIntervalType ?: CustomIntervalType;
  
  clearedDates       ?: string[]; // TODO: Future feature for skipping instances of an event.

  givenDays          ?: number[];
  fromAccount        ?: string;
  toAccount          ?: string; 
  updatedAt          ?: number;
  category           ?: string;
  discretionary      ?: boolean; // Future feature for sorting, showing things that are required.

  arbitraryDates     ?: string[]; 
  fromHelper         ?: string;
  
  autoClear          ?: boolean;
  
}
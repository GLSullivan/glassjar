import { RecurrenceFrequency, TransactionType, CustomIntervalType } from './../utils/constants';

export interface Transaction {
  transactionName     : string;
  type                : TransactionType;
  amount              : number; 
  
  event_id            : string; 
  date                : string;
  description         : string;
  ends               ?: boolean;
  endDate            ?: string;

  isRecurring         : boolean;
  recurrenceInterval ?: number;  
  recurrenceFrequency?: RecurrenceFrequency;
  customIntervalType ?: CustomIntervalType;

// New Values
start_date?: string;    // TODO: These are most certainly NOT optional, take this out after the transition to rrule
end_date  ?: string;
rrule      : string;
exdates   ?: string[];

  clearedDates       ?: string[]; // TODO: Future feature for skipping instances of an event.
  givenDays          ?: number[];
  arbitraryDates     ?: string[]; 
  
  showInCalendar      : boolean; 

  fromAccount        ?: string;
  toAccount          ?: string; 
  updatedAt          ?: number;
  category           ?: string;
  discretionary      ?: boolean; // Future feature for sorting, showing things that are required.

  fromHelper         ?: string;
  
  autoClear          ?: boolean;
  
}
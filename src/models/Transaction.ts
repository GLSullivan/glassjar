import {
  RecurrenceFrequency,
  TransactionType,
  CustomIntervalType,
} from './../utils/constants';

export interface Transaction {
  transactionName: string;
  type           : TransactionType;
  amount         : number;

  event_id    : string;
  description : string;
  ends       ?: boolean;

  isRecurring         : boolean;
  recurrenceInterval  : number;
  recurrenceFrequency?: RecurrenceFrequency;
  customIntervalType ?: CustomIntervalType;

  // New Values
  start_date : string;    
  end_date  ?: string;
  rrule      : string;
  exdates   ?: string[];

  givenDays      : number[];
  arbitraryDates?: string[];

  showInCalendar: boolean;

  fromAccount  ?: string;
  toAccount    ?: string;
  updatedAt    ?: number;
  category     ?: string;
  discretionary?: boolean;  // Future feature for sorting, showing things that are required.

  fromHelper?: string;

  autoClear?: boolean;
}

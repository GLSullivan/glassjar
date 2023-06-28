export interface Transaction {
  transactionName     : string;
  id                  : number;
  type                : 'deposit' | 'withdrawal' | 'transfer' | 'event';
  amount              : number;
  date                : string;
  description         : string;
  isRecurring         : boolean;
  allowOverpayment    : boolean;
  showInCalendar      : boolean;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'given days' | 'twice monthly' | 'custom' | 'arbitrary';
  customIntervalType ?: 'day' | 'week' | 'month' | 'year';
  givenDays          ?: number[];
  recurrenceInterval ?: number;  
  endDate            ?: string;
  fromAccount        ?: string;
  toAccount          ?: string;
  updatedAt          ?: number;
  category           ?: string;
  skippedDates       ?: [];
  arbitraryDates     ?: string[]; // Future feature for holidays and anything with arbitrary recurrences. 
  discretionary      ?: boolean; // Future feature for sorting, showing things that are required.
}
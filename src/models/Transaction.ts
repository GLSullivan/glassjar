export interface Transaction {
  transactionName     : string;
  id                  : number;
  type                : 'deposit' | 'withdrawal' | 'transfer' | 'event';
  amount              : number;
  date                : string;
  description         : string;
  isRecurring         : boolean;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'given days' | 'twice monthly' | 'custom';
  customIntervalType ?: 'day' | 'week' | 'month' | 'year';
  givenDays          ?: number[];
  recurrenceInterval ?: number;  
  endDate            ?: string;
  fromAccount        ?: string;
  toAccount          ?: string;
  allowOverpayment    : false;
  showInCalendar      : true;
  updatedAt          ?: number;
  category           ?: string;
  skippedDates       ?: [];
  arbitraryDates     ?: []; // Future feature for holidays and anything with arbitrary recurrences. 
}
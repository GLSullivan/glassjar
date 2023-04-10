export interface Transaction {
  transactionName     : string;
  id                  : number;
  accountId           : string;
  type                : 'deposit' | 'withdrawal' | 'transfer' | 'event';
  amount              : number;
  date                : string;
  description         : string;
  isRecurring         : boolean;
  endDate            ?: string;
  recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  fromAccount         : string;
  toAccount           : string;
  allowOverpayment    : false;
  showInCalendar      : true;
}

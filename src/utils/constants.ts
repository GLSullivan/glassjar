// Transaction Constants
export enum TransactionType {
  DEPOSIT    = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER   = 'transfer',
  EVENT      = 'event'
}

export enum CustomIntervalType {
  DAY   = 'day',
  WEEK  = 'week',
  MONTH = 'month',
  YEAR  = 'year'
}

export enum RecurrenceFrequency {
  DAILY         = 'daily',
  WEEKLY        = 'weekly',
  MONTHLY       = 'monthly',
  YEARLY        = 'yearly',
  GIVEN_DAYS    = 'given days',
  TWICE_MONTHLY = 'twice monthly',
  CUSTOM        = 'custom',
  ARBITRARY     = 'arbitrary'
}

// Account Constants
export enum AccountType {
  CHECKING    = 'checking',
  SAVINGS     = 'savings',
  CREDIT_CARD = 'credit card',
  LOAN        = 'loan',
  MORTGAGE    = 'mortgage',
  CASH        = 'cash'
}

// Transaction Constants
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'given days' | 'twice monthly' | 'custom' | 'arbitrary';
export type TransactionType     = 'deposit' | 'withdrawal' | 'transfer' | 'event';
export type CustomIntervalType  = 'day' | 'week' | 'month' | 'year';

// Account Constants
export type AccountType  = 'checking' | 'savings' | 'credit card' | 'loan' | 'mortgage' | 'cash'
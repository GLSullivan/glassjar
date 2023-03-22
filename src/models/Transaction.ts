export interface Transaction {
    id: number;
    accountId: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    date: string;
    description: string;
    isRecurring: boolean;
    recurrenceFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }
  
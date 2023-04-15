export interface Account {
  id: string;
  name: string;
  currentBalance: number;
  type: 'checking' | 'savings' | 'credit card' | 'loan' | 'mortgage' | 'cash';
  interestRate?: number;
  lastUpdated: string;
  updatedAt?: number;
}

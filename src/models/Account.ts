export interface Account {
  id             : string;
  name           : string;
  currentBalance : number;
  type           : 'checking' | 'savings' | 'credit card' | 'loan' | 'mortgage' | 'cash';
  interestRate  ?: number; // Stored as a whole number, ex: 5% = 5. 
  lastUpdated    : string;
  updatedAt     ?: number;
}

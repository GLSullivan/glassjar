export interface Account {
  id             : string;
  name           : string;
  currentBalance : number;
  type           : 'checking' | 'savings' | 'credit card' | 'loan' | 'mortgage' | 'cash';
  isLiability    : boolean;
  lastUpdated    : string;
  showInGraph    : boolean;
  color          : number; 
  interestRate  ?: number;
  updatedAt     ?: number;
  dueDate       ?: string;
  creditLimit   ?: number;
}

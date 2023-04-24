export interface Account {
  id             : string;
  name           : string;
  currentBalance : number;
  type           : 'checking' | 'savings' | 'credit card' | 'loan' | 'mortgage' | 'cash';
  interestRate  ?: number;
  isLiability    : boolean;
  lastUpdated    : string;
  updatedAt     ?: number;
  showInGraph    : boolean;
  dueDate       ?: string;
  color          : string; 
  creditLimit   ?: number; // TODO - Wire this up! 
}

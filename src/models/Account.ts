import { AccountType } from './../utils/constants';

export interface Account {
  id             : string;
  name           : string;
  currentBalance : number;
  type           : AccountType;
  isLiability    : boolean;
  lastUpdated    : string;
  showInGraph    : boolean;
  color          : number; 
  interestRate  ?: number;
  updatedAt     ?: number;
  dueDate       ?: string;
  creditLimit   ?: number;
}

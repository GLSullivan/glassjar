import { AccountType } from './../utils/constants';

export interface Account {
  name                       : string;
  id                         : string;
  currentBalance             : number;
  type                       : AccountType;
  isLiability                : boolean;
  lastUpdated                : string;
  showInGraph                : boolean;
  color                      : number;
  
  interestRate              ?: number;
  dueDate                   ?: string;
  creditLimit               ?: number;
  isSpendingPower           ?: boolean;

  notifyOnAccountStale      ?: boolean;
  notifyOnAccountOverDraft  ?: boolean;
  notifyOnAccountOverCredit ?: boolean;
  notifyOnAccountPayoff     ?: boolean;

  snoozedMessages           ?: { messageType: string; date: string; }[];
}

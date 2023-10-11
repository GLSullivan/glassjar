import { Account } from '../models/Account';

type MessageType = {
  type   : string;
  date   : string;
  account: Account;
  isSolo?: boolean; 
};

export default function messageFactory({
  type,
  date,
  account,
  isSolo
}: MessageType): string {

  const accountName = isSolo ? 'This account' : account.name;

  switch (type) {
    case 'accountPayoff': 
      return `${accountName} will be paid off on ${new Date(date).toLocaleDateString()}`;
    case 'accountOverCredit': 
      return `${accountName} will exceed its credit limit of $${account.creditLimit} on ${new Date(date).toLocaleDateString()}`;
    case 'accountOverdraft': 
      return `${accountName} will be overdrawn on ${new Date(date).toLocaleDateString()}`
    case 'accountStale': 
      return `${accountName} has not been updated since ${new Date(account.lastUpdated).toLocaleDateString()}`;
    // TODO: Add more cases here for other message types
    // TODO: Add more structure here. Maybe a date; instead of 'Mortgage hasn't been updated since X/XX/XXXX' do '10/15/2023: Mortgage hasn't been updated in 5 months0'
    default: 
      return 'Unknown message type';
  }
}

import React from 'react';
import { Account } from '../models/Account';

interface AccountListProps {
  accounts: Account[];
}

export const AccountList: React.FC = () => {
  return (
    <div>
      <h3>Accounts</h3>
      {/* <ul>
        {accounts.map((account) => (
          <li key={account.id}>
            {account.name} - Balance: ${account.balance.toFixed(2)}
          </li>
        ))}
      </ul> */}
    </div>
  );
};

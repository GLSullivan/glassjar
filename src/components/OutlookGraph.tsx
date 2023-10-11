import React, { useState, useEffect } from 'react';
import SVGGraph from './../components/SVGGraph';

import { useSelector } from 'react-redux';

import { Account } from './../models/Account';
import { RootState } from './../redux/store';

import './../css/OutlookGraph.css';

const OutlookGraph: React.FC = () => {
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);
  const accounts   = useSelector((state: RootState) => state.accounts.accounts);
  const today      = useSelector((state: RootState) => state.activeDates.today);
  const graphRange = useSelector((state: RootState) => state.views.graphRange);
  const state      = useSelector((state: RootState) => state);

  const [graphingAccounts, setGraphingAccounts] = useState<Account[]>([]);

  useEffect(() => {
    let tempGraphingAccounts: Account[] = [];

    for (const account of accounts) {
      if (account.showInGraph) {
        tempGraphingAccounts.push(account);
      }
    }

    setGraphingAccounts(tempGraphingAccounts);
      // eslint-disable-next-line
  }, [activeDate, accounts, state, graphRange, today]);

  if (accounts.length === 0) {
    return (
      <div>No accounts available. Please add an account to see the graph.</div>
    );
  }

  return (
    <div className='glassjar__graph-holder'>
          <SVGGraph
            accounts={graphingAccounts}
            hideStartEnd={true}
          />
    </div>
  );
};

export default OutlookGraph;


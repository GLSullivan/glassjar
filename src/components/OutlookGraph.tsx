import React, { useState, useEffect } from 'react';

import {
  startOfMonth,
  formatISO,
  endOfMonth,
  addMonths,
  isAfter,
  isToday,
} from 'date-fns';

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

  function firstOrToday(inputDate: string) {
    const todayDate       = new Date(today);                    // gets today's date
    const firstDayOfMonth = startOfMonth(new Date(inputDate));  // gets the first day of the month of inputDate

    if (isAfter(firstDayOfMonth, todayDate) || isToday(firstDayOfMonth)) {
        // If the first day of the inputDate month is later than today, or it is today
      return formatISO(firstDayOfMonth);
    } else {
      return formatISO(todayDate);  // If today's date is later
    }
  }

  const graphStart = firstOrToday(activeDate);
  const graphEnd   = formatISO(
    endOfMonth(addMonths(new Date(graphStart), graphRange || 6))
  );

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
      <div className='glassjar__graph-holder__sub'>
        <div className='glassjar__graph-holder__sub-sub'>
          <SVGGraph
            accounts={graphingAccounts}
            startDate={graphStart}
            endDate={graphEnd}
            hideStartEnd={true}
          />
        </div>
      </div>
    </div>
  );
};

export default OutlookGraph;


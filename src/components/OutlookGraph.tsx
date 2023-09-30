import React, { 
  useState, 
  useEffect }                                 from 'react';

import { 
  startOfMonth,
  addDays,
  formatISO,
  format, 
  endOfMonth, 
  addMonths, 
  isAfter,
  isToday }                                   from 'date-fns';

import SVGGraph                               from './../components/SVGGraph';  

import { useSelector }                        from 'react-redux';

import { accountBalancesByDateRange }         from './../redux/slices/projections';
import { accountColors }                       from '../data/AccountColors';
import { Account }                            from './../models/Account';
import { RootState }                          from './../redux/store';

import './../css/OutlookGraph.css';

const OutlookGraph: React.FC = () => {
  
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);
  const accounts   = useSelector((state: RootState) => state.accounts.accounts);
  const today      = useSelector((state: RootState) => state.activeDates.today);
  const graphRange = useSelector((state: RootState) => state.views.graphRange);
  const state      = useSelector((state: RootState) => state);
  
  const [combinedData, setCombinedData] = useState<CombinedData[]>([]);

  type CombinedData = {
    date         : string;
    [key: string]: number | string;
  };

  function firstOrToday(inputDate: string) {
    const todayDate       = new Date(today);                    // gets today's date
    const firstDayOfMonth = startOfMonth(new Date(inputDate));  // gets the first day of the month of inputDate

    if (isAfter(firstDayOfMonth, todayDate) || isToday(firstDayOfMonth)) { // If the first day of the inputDate month is later than today, or it is today
      return formatISO(firstDayOfMonth);
    } else {
      return formatISO(todayDate); // If today's date is later
    }
  }

  useEffect(() => {

    const graphStart = firstOrToday(activeDate);
    const graphEnd   = formatISO(endOfMonth(addMonths(new Date(graphStart), graphRange || 6)));

    const colors: Record<string, string> = {};

    const accountBalances: number[][] = [];
    const graphingAccounts: Account[] = [];

    for (const account of accounts) {
      if (account.showInGraph) {
        const balances = accountBalancesByDateRange(
          state,
          account.id,
          graphStart,
          graphEnd
        ) as number[];
        accountBalances.push(balances);
        graphingAccounts.push(account)
        colors[account.name] = accountColors[account.color];
        // console.log(account.name,balances)
      }
    }

    const tempCombinedData: CombinedData[] = [];

    let   minY                             = Infinity;
    let   maxY                             = -Infinity;

    if (accountBalances[0] && Array.isArray(accountBalances[0])) {
      for (let dayIndex = 0; dayIndex < accountBalances[0].length; dayIndex++) {
        const date                  = addDays(new Date(graphStart), dayIndex);
        const dayData: CombinedData = {
          date: format(date, 'M/d/yy')
        };

        for (
          let accountIndex = 0;
          accountIndex < graphingAccounts.length;
          accountIndex++
        ) {
          let multiplier = 1;
          if (graphingAccounts[accountIndex].isLiability) {
            multiplier = -1;
          }
          const balance = (
            (accountBalances[accountIndex][dayIndex] * multiplier) /
            100
          ).toFixed(2);
          dayData[graphingAccounts[accountIndex].name] = balance;

          minY = Math.min(minY, Number(balance));
          maxY = Math.max(maxY, Number(balance));
        }
        tempCombinedData.push(dayData);
      }

      let new_yTicks = [minY];
      if (minY < 0 && maxY > 0) {
        new_yTicks.push(0);
      }
      new_yTicks.push(maxY);

      setCombinedData(tempCombinedData)
    }
// eslint-disable-next-line
  }, [
    activeDate,
    accounts,
    state,
    graphRange,
    today
  ])

  if (accounts.length === 0) {
    return (
      <div>No accounts available. Please add an account to see the graph.</div>
    );
  }

  const dataSets = Object.keys(combinedData[0] || {})
  .filter((key) => key !== 'date')
  .map((account) => {
    const accountInfo = accounts.find((acc) => acc.name === account);
    return {
      name: account,
      data: combinedData.map((entry) => ({
        date : new Date(entry.date),
        value: parseFloat(entry[account] as string),
      })),
      color: accountColors[accountInfo?.color || 0],   // Fallback to a default color if not found
    };
  });

  return (
    <div className="glassjar__graph-holder">
      <div className="glassjar__graph-holder__sub">
        <div className="glassjar__graph-holder__sub-sub">
          <SVGGraph dataSets={dataSets} />
        </div>
      </div>
    </div>
  );
};

export default OutlookGraph;

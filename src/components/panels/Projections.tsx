import React, { useMemo }              from 'react';
import { useSelector }                  from 'react-redux';

import {
  accountBalanceOnDate,
  computeDayFigures,
}                                       from '../../redux/slices/projections';
import { selectAllAccounts }            from '../../redux/slices/accounts';
import { RootState }                    from '../../redux/store';
import { anyToDateKey, fromDateKey, toDateKey } from '../../utils/dateKey';

import AccountListItem                  from '../AccountListItem';
import { addMonths, format }            from 'date-fns';

import CountUp                          from 'react-countup';

import './../../css/Panels.css';

interface DayPanelProps {
  showActiveDate?: boolean;
}

export const DayPanel: React.FC<DayPanelProps> = ({ showActiveDate = false }) => {
  const graphRange  = useSelector((state: RootState) => state.views.graphRange);
  const activeDate  = useSelector((state: RootState) => state.activeDates.activeDate);
  const projections = useSelector((state: RootState) => state.projections);
  const accounts    = useSelector(selectAllAccounts);

  const todayKey   = toDateKey(new Date());
  const displayKey = showActiveDate && activeDate
    ? anyToDateKey(activeDate)
    : toDateKey(addMonths(fromDateKey(todayKey), graphRange));

  const figures = useMemo(
    () => computeDayFigures(projections, accounts, displayKey),
    [projections, accounts, displayKey]
  );
  const todaysFigures = useMemo(
    () => computeDayFigures(projections, accounts, todayKey),
    [projections, accounts, todayKey]
  );

  const { spendingPower, savings, cash, availableCredit, debt, creditCardDebt, loanDebt, netWorth } = figures;
  const todaysWorth = todaysFigures.netWorth;

  return (
    <div className='glassjar__list glassjar__list--projections'>
      <h3>{format(fromDateKey(displayKey), 'M/d/yy')}</h3>
      <div className='glassjar__grid glassjar__grid--projected-info'>

        {spendingPower !== null && (
          <>
            <h4>Spending Power:</h4>
            <h4>
              <CountUp
                decimals={2}
                decimal='.'
                prefix='$'
                end={spendingPower / 100}
                duration={2}
                preserveValue={true}
                className='glassjar__mono-spaced'
              />
            </h4>
          </>
        )}

        {savings !== null && (
          <>
            <h5>Savings:</h5>
            <h5>
              <CountUp
              decimals={2}
              decimal='.'
              prefix='$'
              end={savings / 100}
              duration={2}
              preserveValue={true}
              className='glassjar__mono-spaced'
            />
            </h5>
          </>
        )}

        {cash !== null && (
          <>
            <h5>Cash On Hand:</h5>
            <h5>
              <CountUp
              decimals={2}
              decimal='.'
              prefix='$'
              end={cash / 100}
              duration={2}
              preserveValue={true}
              className='glassjar__mono-spaced'
            />
            </h5>
          </>
        )}

        {availableCredit !== null && (
          <>
            <h5>Available Credit:</h5>
            <h5>
              <CountUp
                decimals={2}
                decimal='.'
                prefix='$'
                end={availableCredit / 100}
                duration={2}
                preserveValue={true}
                className='glassjar__mono-spaced'
              />
            </h5>
          </>
        )}

        {debt !== null && (
          <>
            <h4>Debt:</h4>
            <h4>
              <CountUp
                decimals={2}
                decimal='.'
                prefix='$'
                end={debt / 100}
                duration={2}
                preserveValue={true}
                className='glassjar__mono-spaced'
              />
            </h4>
          </>
        )}

        {creditCardDebt !== null && (
          <>
            <h5>Credit Card Balances:</h5>
            <h5>
              <CountUp
              decimals={2}
              decimal='.'
              prefix='$'
              end={creditCardDebt / 100}
              duration={2}
              preserveValue={true}
              className='glassjar__mono-spaced'
            />
            </h5>
          </>
        )}

        {loanDebt !== null && (
          <>
            <h5>Loans:</h5>
            <h5>
            <CountUp
              decimals={2}
              decimal='.'
              prefix='$'
              end={loanDebt / 100}
              duration={2}
              preserveValue={true}
              className='glassjar__mono-spaced'
            />
            </h5>
          </>
        )}

        {netWorth !== null && (
          <>
            <h4>Net Worth:</h4>
            <div>
            <h4>
              <CountUp
                decimals={2}
                decimal='.'
                prefix='$'
                end={netWorth / 100}
                duration={2}
                preserveValue={true}
                className='glassjar__mono-spaced'
              />
            </h4>
           { todaysWorth !== null && (
            <>
              {(netWorth - todaysWorth) > 0 ? '+': ''}
              <CountUp
                decimals={2}
                decimal='.'
                prefix='$'
                end={(netWorth - todaysWorth) / 100}
                duration={2}
                preserveValue={true}
                className='glassjar__mono-spaced'
              /></>)}
              </div>
          </>
        )}

      </div>
      <h3>Accounts</h3>
      <div className='glassjar__flex glassjar__flex--column'>
        {accounts.map((account) => (
          <AccountListItem
            hideDateLine={!showActiveDate}
            key={account.id}
            account={account}
            balance={showActiveDate ? accountBalanceOnDate(projections, account.id, displayKey) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

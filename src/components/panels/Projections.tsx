
import React                                                      from 'react';
import { useSelector }                                            from 'react-redux';
      
import {                
  // accountBalanceOnDate,            
  getCashByDate,            
  getAvailableCreditByDate,            
  getSavingsByDate,            
  getSpendingPowerByDate,           
  getDebtByDate,                
  getCreditCardDebtByDate,           
  getLoanDebtByDate,       
  getNetWorthByDate           
}                                                                 from '../../redux/slices/projections';
// import { selectAllAccounts }                                      from '../../redux/slices/accounts';
import { RootState }                                              from '../../redux/store';
      
// import AccountListItem                                            from '../AccountListItem';
import { endOfMonth, formatISO, addMonths, startOfDay,format }    from 'date-fns';

import './../../css/Panels.css';
import CountUp from 'react-countup';

export const DayPanel: React.FC = () => {
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);
  const graphRange = useSelector((state: RootState) => state.views.graphRange);
  const state      = useSelector((state: RootState) => state);
  // const accounts   = useSelector(selectAllAccounts);

  const graphEnd   = formatISO(startOfDay(endOfMonth(addMonths(new Date(activeDate), graphRange || 6))));

  const spendingPower   = getSpendingPowerByDate(state, graphEnd)
  const savings         = getSavingsByDate(state, graphEnd)
  const cash            = getCashByDate(state, graphEnd)
  const availableCredit = getAvailableCreditByDate(state, graphEnd)
  const debt            = getDebtByDate(state, graphEnd)
  const creditCardDebt  = getCreditCardDebtByDate(state, graphEnd)
  const loan            = getLoanDebtByDate(state, graphEnd)
  const netWorth        = getNetWorthByDate(state, graphEnd)

  return (
    <div className='glassjar__list glassjar__list--projections'>
      {/* <h3>{graphRange} Month Projection</h3> */}
      <h3>{format(new Date(graphEnd), 'M/d/yy')}</h3>
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
              end={getSavingsByDate(state, graphEnd)! / 100}
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

        {loan !== null && (
          <>
            <h5>Loans:</h5>
            <h5>
            <CountUp
              decimals={2}
              decimal='.'
              prefix='$'
              end={loan / 100}
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
          </>
        )}

      </div>
      {/* <h3>Accounts</h3>
      <div className='glassjar__flex glassjar__flex--column'>
        {accounts.map((account) => (
          <AccountListItem
            key={account.id}
            account={account}
            balance={accountBalanceOnDate(state, account.id, graphEnd)}
          />
        ))}
      </div> */}
    </div>
  );
};

import { useDispatch }                from 'react-redux';
import React                          from 'react';
import CountUp                        from 'react-countup';

import { setActiveAccount }           from '../redux/slices/accounts';
import { openAccountForm }            from '../redux/slices/modals';
import { accountColors }               from '../data/AccountColors';
import { AccountType }                from './../utils/constants';
import { Account }                    from '../models/Account';

import './../css/Panels.css';
// import SVGGraph from './SVGGraph';

interface AccountListItem {
  account : Account;
  balance?: number;
}

const accountTypeIcons: { [K in AccountType]: string } = {
  'checking'     : 'glassjar__list-icon fa-solid fa-fw fa-money-check-dollar-pen',
  'savings'      : 'glassjar__list-icon fa-solid fa-fw fa-piggy-bank',
  'credit card'  : 'glassjar__list-icon fa-solid fa-fw fa-credit-card',
  'loan'         : 'glassjar__list-icon fa-solid fa-fw fa-hand-holding-dollar',
  'mortgage'     : 'glassjar__list-icon fa-solid fa-fw fa-house-chimney-window',
  'cash'         : 'glassjar__list-icon fa-solid fa-fw fa-wallet',
};

function getNextOccurrence(dateString: string | undefined) {
  if (dateString === undefined) {
    return
  }

  const currentDate = new Date();
  currentDate.setMonth(currentDate.getMonth() + 1);  // Move to the next month.
  currentDate.setDate (1);                           // Set to the first day of the next month.

  const dateParts   = dateString.split('-');
  const dayInMonth  = Number(dateParts[2]);
  let   targetMonth = currentDate.getMonth();
  let   targetYear  = currentDate.getFullYear();

  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // If the given day is after the end of the next month, use the last day of the next month.
  const targetDay = dayInMonth <= daysInTargetMonth ? dayInMonth : daysInTargetMonth;

  const targetDate = new Date(targetYear, targetMonth, targetDay);

  // Format the date to Month DayOrdinal format
  const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
  const day = targetDate.getDate();
  
  let daySuffix;
  if (day % 10 === 1 && day !== 11) {
    daySuffix = 'st';
  } else if (day % 10 === 2 && day !== 12) {
    daySuffix = 'nd';
  } else if (day % 10 === 3 && day !== 13) {
    daySuffix = 'rd';
  } else {
    daySuffix = 'th';
  }

  return `${monthNames[targetMonth]} ${day}${daySuffix}`;
}

  
const CalendarDay: React.FC<AccountListItem> = React.memo(
  ({ account, balance }) => {
    const dispatch = useDispatch();

    return (
      <div className='glassjar__list-item glassjar__list-item--account' onClick={() => { dispatch(setActiveAccount(account)); dispatch(openAccountForm()); }} key={account.id}>
        
        {/* <SVGGraph dataSets={dataSets} /> */}

        <div className='glassjar__list-item__icon'>
          <i className={accountTypeIcons[account.type]} />
          <div className='glassjar__list-icon__backing' style={{ background: accountColors[account.color] }} />
        </div>
        <div className='glassjar__list-item__body'>
          <div className='glassjar__list-item-row glassjar__list-item__row--row1'>
            <h4>{account.name}</h4>
            <h4 className='glassjar__mono-spaced'>
              {balance !== undefined && balance !== null
                ? <em>
                  <CountUp 
                    decimals={2}
                    decimal="."
                    prefix="$"
                    end={(balance / 100)} 
                    duration={2}
                    preserveValue={true}
                    />
                </em>
                : 
                <em>
                  <CountUp 
                    decimals={2}
                    decimal="."
                    prefix="$"
                    end={(account.currentBalance / 100)} 
                    duration={2}
                    preserveValue={true}
                    />
                </em>
                }
            </h4>
          </div>
          <div className='glassjar__list-item-row glassjar__list-item__row--row2'>
            <h5>{account.dueDate && <>Due Next: {getNextOccurrence(account.dueDate)}</>}</h5>
            <h5>{account.interestRate && <>{account.interestRate}%</>}</h5>
          </div>

        </div>
        <div className='glassjar__list-item__backing' style={{ background: accountColors[account.color] }} />
      </div>
    );
  }
);

export default CalendarDay;

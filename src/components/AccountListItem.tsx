import { useDispatch, useSelector }                from 'react-redux';
import React                          from 'react';
import CountUp                        from 'react-countup';

import { setActiveAccount }           from '../redux/slices/accounts';
import { openAccountForm }            from '../redux/slices/modals';
import { accountColors }               from '../data/AccountColors';
import { AccountType }                from './../utils/constants';
import { Account }                    from '../models/Account';

import './../css/Panels.css';
import SVGGraph from './SVGGraph';
import { RootState } from '../redux/store';
import {
  startOfMonth,
  formatISO,
  endOfMonth,
  addMonths,
  isAfter,
  isToday,
} from "date-fns";

interface AccountListItem {
  account : Account;
  balance?: number;
}

const accountTypeIcons: { [K in AccountType]: string } = {
  'checking'   : 'glassjar__list-icon fa-solid fa-fw fa-money-check-dollar-pen',
  'savings'    : 'glassjar__list-icon fa-solid fa-fw fa-piggy-bank',
  'credit card': 'glassjar__list-icon fa-solid fa-fw fa-credit-card',
  'loan'       : 'glassjar__list-icon fa-solid fa-fw fa-hand-holding-dollar',
  'mortgage'   : 'glassjar__list-icon fa-solid fa-fw fa-house-chimney-window',
  'cash'       : 'glassjar__list-icon fa-solid fa-fw fa-wallet',
};

function getNextOccurrence(dateString: string | undefined) {
  if (dateString === undefined) {
    return
  }

  const currentDate = new Date();
  
  currentDate.setMonth(currentDate.getMonth() + 1);  // Move to the next month.
  currentDate.setDate  (1);                          // Set to the first day of the next month.

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
  const day        = targetDate.getDate();
  
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

    const graphRange = useSelector((state: RootState) => state.views.graphRange);
    const today      = useSelector((state: RootState) => state.activeDates.today);
    const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);

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

    return (
      <div className = 'glassjar__list-item glassjar__list-item--account' onClick = {() => { dispatch(setActiveAccount(account)); dispatch(openAccountForm()); }} key = {account.id}>
        
        <SVGGraph
          accounts  = {[account]}
          startDate = {graphStart}
          endDate   = {graphEnd}
          hideSpan  = {true}
          hideZero  = {true}
          hideTrend = {true}
          hideDates = {true}
          hideRange = {true}
          hideToday = {true}
          thickness = {2}
        />

        <div className = 'glassjar__list-item__icon'>
        <i   className = {accountTypeIcons[account.type]} />
        <div className = 'glassjar__list-icon__backing' style = {{ background: accountColors[account.color] }} />
        </div>
        <div className = 'glassjar__list-item__body'>
        <div className = 'glassjar__list-item-row glassjar__list-item__row--row1'>
            <h4>{account.name}</h4>
            <h4 className = 'glassjar__mono-spaced'>
              {balance !== undefined && balance !== null
                ? <em>
                  <CountUp 
                    decimals      = {2}
                    decimal       = "."
                    prefix        = "$"
                    end           = {(balance / 100)}
                    duration      = {2}
                    preserveValue = {true}
                    />
                </em>
                : 
                <em>
                  <CountUp 
                    decimals      = {2}
                    decimal       = "."
                    prefix        = "$"
                    end           = {(account.currentBalance / 100)}
                    duration      = {2}
                    preserveValue = {true}
                    />
                </em>
                }
            </h4>
          </div>
          <div className = 'glassjar__list-item-row glassjar__list-item__row--row2'>
            <h5>{account.dueDate && <>Due Next: {getNextOccurrence(account.dueDate)}</>}</h5>
            <h5>{account.interestRate && <>{account.interestRate}%</>}</h5>
          </div>
        </div>
        <div className = 'glassjar__list-item__backing' style = {{ background: accountColors[account.color] }} />
      </div>
    );
  }
);

export default CalendarDay;

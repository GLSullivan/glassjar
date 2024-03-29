import { useDispatch, useSelector }    from 'react-redux';
import React                           from 'react';
 
import { setActiveAccount }            from './../redux/slices/accounts';
import { accountTypeIcons }            from './../data/AccountTypeIcons';
import { openAccountForm }             from './../redux/slices/modals'; // TODO: Rewrite the modals to use HTML modals and maybe not require state.
import { accountColors }               from './../data/AccountColors';
import { Account }                     from './../models/Account';

import { format }                      from 'date-fns';

import './../css/ListItems.css'; 

import SVGGraph                        from './SVGGraph';
import { RootState }                   from './../redux/store';
import { getAccountMessages,
  getTransactionsByAccount }           from './../redux/slices/projections';

interface AccountListItemProps {
  account      : Account;
  balance?     : number;
  hideDateLine?:boolean;
}

function getNextOccurrence(dateString: string | undefined) {
  if (dateString === undefined) {
    return
  }
  
  const currentDate = new Date();
  
  currentDate.setMonth(currentDate.getMonth() + 1);  
  currentDate.setDate  (1);                          

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
  
const AccountListItem: React.FC<AccountListItemProps> = React.memo(
  ({ account, balance = null, hideDateLine = false }) => {
    const dispatch    = useDispatch();
    const projections = useSelector((state: RootState) => state.projections);
    const activeDate  = useSelector((state: RootState) => state.activeDates.activeDate);

    const messages = getAccountMessages(projections, account);

    function blendWithWhite(color: string, alpha: number) {
      const r = Math.floor((1 - alpha) * 255 + alpha * parseInt(color.slice(1, 3), 16));
      const g = Math.floor((1 - alpha) * 255 + alpha * parseInt(color.slice(3, 5), 16));
      const b = Math.floor((1 - alpha) * 255 + alpha * parseInt(color.slice(5, 7), 16));
      
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    return (
      <div
        className='glassjar__list-item glassjar__list-item--account'
        onClick={() => {
          dispatch(setActiveAccount(account));
          dispatch(openAccountForm());
        }}
        key={account.id}
        style={{ ['--box-color' as any]:  blendWithWhite(accountColors[account.color], .1) }}>

        <div className='glassjar__list-item__header' style={{ background: accountColors[account.color] }}>
          <div className='glassjar__list-item__icon'>
            <i className={accountTypeIcons[account.type]} />
          </div>
          <div className='glassjar__list-item__header--mid'>
          <div className='glassjar__list-item__headline'>
              <h4>{account.name}</h4>
              {account.interestRate && <h5>{account.interestRate}%</h5>}
            </div>
            <h5>{balance && 
            
            
            (balance / 100).toLocaleString('en-US', {style   : 'currency',currency: 'USD',})} on {format(new Date(activeDate), 'M/d/yy')}
            
            
            </h5>
            <div className='glassjar__list-item__details'>
              {account.dueDate && (<h5>Due Next: {getNextOccurrence(account.dueDate)}</h5>)} 
              
            </div>
          </div>
          {messages.length > 0 &&<div>
            <h3 style={{ color: accountColors[account.color] }}>{messages.length}</h3>
          </div>}
        </div>
        <div className='glassjar__list-item__body'>
          <SVGGraph
            accounts  = {[account]}
            hideZero  = {true}
            hideTrend = {true}
            hideDates = {true}
            hideRange = {true}
            hideToday = {hideDateLine}
            hideMonth = {true}
            thickness = {2}
          />
        </div>
        <div className='glassjar__list-item__footer'>
          <h5 className='glassjar__fill-back'><span>{getTransactionsByAccount(projections, account.id).length} transaction{getTransactionsByAccount(projections, account.id).length !== 1 && <>s</>}</span></h5>
        </div>
        <div
          className='glassjar__list-item__backing'
          style={{ background: accountColors[account.color] }}
        />
      </div>
    );
  }
);

export default AccountListItem;

import { useDispatch, useSelector } from 'react-redux';
import React                        from 'react';

import { setActiveTransaction }     from './../redux/slices/transactions';
import { openTransactionModal }     from './../redux/slices/modals';

import { Transaction }              from './../models/Transaction';
import { accountColors }             from '../data/AccountColors';
import { RootState }                from './../redux/store';

import './../css/ListItems.css';

interface TransactionListItem {
  transaction: Transaction;
  showSearch?: boolean;
}

const transactionTypeIcons = {
  'deposit'   : 'glassjar__list-icon fa-solid fa-fw fa-plus-circle',
  'withdrawal': 'glassjar__list-icon fa-solid fa-fw fa-minus-circle',
  'transfer'  : 'glassjar__list-icon fa-solid fa-fw fa-money-bill-transfer',
  'event'     : 'glassjar__list-icon fa-solid fa-fw fa-fw fa-calendar'
};

const CalendarDay: React.FC<TransactionListItem> = React.memo(
  ({ transaction, showSearch = false }) => {
    const dispatch = useDispatch();
    const activeSearch = useSelector((state: RootState) => state.search.search);
    const accounts = useSelector((state: RootState) => state.accounts.accounts);

    let accountColor;
    let toAccountIndex = accounts.findIndex(account => account.id === transaction.toAccount);
    let fromAccountIndex = accounts.findIndex(account => account.id === transaction.fromAccount);
    
    if (transaction.type === 'deposit' && toAccountIndex !== -1) {
      const toAccountColor = accounts[toAccountIndex].color;
      if (accountColors[toAccountColor] !== undefined) {
        accountColor = accountColors[toAccountColor];
      }
    } else if (transaction.type === 'transfer' && fromAccountIndex !== -1 && toAccountIndex !== -1) {
      const fromAccountColor = accounts[fromAccountIndex].color;
      const toAccountColor   = accounts[toAccountIndex].color;
      if (accountColors[fromAccountColor] !== undefined) {
        accountColor = 'linear-gradient(70deg, ' + accountColors[fromAccountColor] + ' 0%,' + accountColors[fromAccountColor] + ' 45%,' + accountColors[toAccountColor] + ' 55%,' + accountColors[toAccountColor];
      }
    } else if (fromAccountIndex !== -1) {
      const fromAccountColor = accounts[fromAccountIndex].color;
      if (accountColors[fromAccountColor] !== undefined) {
        accountColor = accountColors[fromAccountColor];
      }
    } 
    
    // If accountColor has not been set, use default
    if(accountColor === undefined) {
      accountColor = '#000';
    }

    const highlightTransactionName = (name: string, search: string) => {
      // Escape special characters in the search string
      search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
      // Split the name by the search string
      const parts = name.split(new RegExp(`(${search})`, 'gi'));
  
      return (
        <>
          {parts.map((part, index) => 
            part.toLowerCase() === search.toLowerCase() ? 
            (<strong key={index}>{part}</strong>) : 
            (part)
          )}
        </>
      );
    };

    return (
      <div className='glassjar__list-item' onClick={() => { dispatch(setActiveTransaction(transaction)); dispatch(openTransactionModal()); }} key={transaction.id}        >
        <div className='glassjar__list-item__icon'>
          <i className={transactionTypeIcons[transaction.type]} />
          {!transaction.isRecurring && (<i style={{ color: accountColor }} className='glassjar__recurring-icon fa-solid fa-star' />)} 
          <div className='glassjar__list-icon__backing' style={{ background: accountColor }} />
        </div>
        <div className='glassjar__list-item__body'>
          <div className='glassjar__list-item-row glassjar__list-item__row--row1'>
          <h4>
              {showSearch ? 
                highlightTransactionName(transaction.transactionName, activeSearch) : 
                transaction.transactionName}
            </h4>
          {transaction.type !== 'event' && <h4>{(transaction.amount / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', })}</h4>}
          </div>
          {transaction.type !== 'event' && <div className='glassjar__list-item-row glassjar__list-item__row--row2'>
            <h5>
              {(transaction.type === 'withdrawal' || transaction.type === 'transfer') &&
                // <span>ERROR</span>
                <span>{accounts[accounts.findIndex(account => account.id === transaction.fromAccount)].name}</span>
              }
              {transaction.type === 'transfer' && <> <i className='fa-solid fa-angle-right' /> </>}
              {(transaction.type === 'deposit' || transaction.type === 'transfer') &&
                // <span>ERROR</span>
                <span>{accounts[accounts.findIndex(account => account.id === transaction.toAccount)].name}</span>
              }</h5>
            {/* {(transaction.category && transaction.category !== 'None') ? <span>{transaction.category}</span> : <span></span>} */}
          </div>}
        </div>
        <div className='glassjar__list-item__backing' style={{ background: accountColor }} />
      </div>
    );
  }
);

export default CalendarDay;

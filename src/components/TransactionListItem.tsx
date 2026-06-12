import { useDispatch, useSelector } from 'react-redux';
import React                        from 'react';
import { format }                   from 'date-fns';

import {
  setActiveTransaction,
  updateTransaction,
  clearOccurrences,
}                                   from './../redux/slices/transactions';
import { openTransactionModal }     from './../redux/slices/modals';

import { solidTransparentColor }    from './../utils/solidTransparentColor';
import { getSpendByTransaction }    from './../redux/slices/projections';
import { fromDateKey }              from './../utils/dateKey';
import { Transaction }              from './../models/Transaction';
import { accountColors }            from './../data/AccountColors';
import { RootState }                from './../redux/store';
import { SwipeElement }             from './SwipeElement';

import './../css/ListItems.css';

interface TransactionListItemProps {
  transaction  : Transaction;
  showSearch  ?: boolean;
  /** A recurring occurrence date; swipe-clear adds it to exdates (skip it). */
  instanceDate?: string;
  /** A past-due floating occurrence date; swipe-clear marks it settled. */
  floatingDate?: string;
}

const transactionTypeIcons = {
  'deposit'   : 'glassjar__list-icon fa-solid fa-fw fa-plus-circle',
  'withdrawal': 'glassjar__list-icon fa-solid fa-fw fa-minus-circle',
  'transfer'  : 'glassjar__list-icon fa-solid fa-fw fa-money-bill-transfer',
  'event'     : 'glassjar__list-icon fa-solid fa-fw fa-fw fa-calendar'
};

const TransactionListItem: React.FC<TransactionListItemProps> = React.memo(
  ({ transaction, showSearch = false, instanceDate = undefined, floatingDate = undefined }) => {
    const dispatch     = useDispatch();
    const activeSearch = useSelector((state: RootState) => state.search.search);
    const accounts     = useSelector((state: RootState) => state.accounts.accounts);
    const projections        = useSelector((state: RootState) => state.projections);

    let accountColor;
    let accountColorTrans;
    let toAccountIndex = accounts.findIndex(
      (account) => account.id === transaction.toAccount
    );
    let fromAccountIndex = accounts.findIndex(
      (account) => account.id === transaction.fromAccount
    );

    if (transaction.type === 'deposit' && toAccountIndex !== -1) {
      const toAccountColor = accounts[toAccountIndex].color;
      if (accountColors[toAccountColor] !== undefined) {
        accountColor = accountColors[toAccountColor];
        accountColorTrans =  solidTransparentColor(accountColors[toAccountColor], 0.1);
      }
    } else if (
      transaction.type === 'transfer' &&
      fromAccountIndex !== -1 &&
      toAccountIndex   !== -1
    ) {
      const fromAccountColor = accounts[fromAccountIndex].color;
      const toAccountColor   = accounts[toAccountIndex].color;
      if (accountColors[fromAccountColor] !== undefined) {
        accountColor = 
          'linear-gradient(70deg, ' +
          accountColors[fromAccountColor] +
          ' 0%,' +
          accountColors[fromAccountColor] +
          ' 45%,' +
          accountColors[toAccountColor] +
          ' 55%,' +
          accountColors[toAccountColor]; 
        accountColorTrans = 
          'linear-gradient(70deg, ' +
          solidTransparentColor(accountColors[fromAccountColor], 0.1) +
          ' 0%,' +
          solidTransparentColor(accountColors[fromAccountColor], 0.1) +
          ' 45%,' +
          solidTransparentColor( accountColors[toAccountColor], 0.1) +
          ' 55%,' +
          solidTransparentColor(accountColors[toAccountColor], 0.1);
      }
    } else if (fromAccountIndex !== -1) {
      const fromAccountColor = accounts[fromAccountIndex].color;
      if (accountColors[fromAccountColor] !== undefined) {
        accountColor = accountColors[fromAccountColor];
        accountColorTrans =  solidTransparentColor(accountColors[fromAccountColor], 0.1);
      }
    }

      // If accountColor has not been set, use default
    if (accountColor === undefined) {
      accountColor = '#000';
      accountColorTrans =  solidTransparentColor('#000', 0.1);
    }

    const highlightTransactionName = (name: string, search: string) => {
        // Escape special characters in the search string
      search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Split the name by the search string
      const parts = name.split(new RegExp(`(${search})`, 'gi'));

      return (
        <>
          {parts.map((part, index) =>
            part.toLowerCase() === search.toLowerCase() ? (
              <strong key = {index}>{part}</strong>
            ) : (
              part
            )
          )}
        </>
      );
    };

    const annualSpend = getSpendByTransaction(projections, transaction.event_id);

    const handleClear = () => {
      if (floatingDate) {
        // Past-due occurrence: mark it settled (clearedDates), not skipped.
        dispatch(clearOccurrences([{ event_id: transaction.event_id, dates: [floatingDate] }]));
        return;
      }

      const existingExdates = transaction.exdates || [];

      // Add instanceDate to existing exdates and filter out undefined values
      const updatedExdates = Array.from(
        new Set([
          ...existingExdates,
          instanceDate,
        ].filter((date): date is string => date !== undefined))
      );

      dispatch(updateTransaction({ ...transaction, exdates: updatedExdates }));
    };

    return (
      <div className='glassjar__list-item__transaction'>
        <SwipeElement disabled={instanceDate === undefined && floatingDate === undefined}>
          <div
              className = "glassjar__list-item"
              onClick   = {() => {
                dispatch(setActiveTransaction(transaction));
                dispatch(openTransactionModal());
              }}
              key   = {transaction.event_id}
              style = {{ background: accountColorTrans }}
            >
            <div className = "glassjar__list-item__icon">
            <i   className = {transactionTypeIcons[transaction.type]} />
              {!transaction.isRecurring && (
                <i
                  style     = {{ color: accountColor }}
                  className = "glassjar__recurring-icon fa-solid fa-star"
                />
              )}
              <div
                className = "glassjar__list-icon__backing"
                style     = {{ background: accountColor }}
              />
            </div>
            <div className = "glassjar__list-item__body">
            <div className = "glassjar__list-item-row glassjar__list-item__row--row1">
                <h4>
                  {showSearch
                    ? highlightTransactionName(
                        transaction.transactionName,
                        activeSearch
                      )
                    : transaction.transactionName}
                </h4>
                {transaction.type !== 'event' && (
                  <h4>
                    {(transaction.amount / 100).toLocaleString('en-US', {
                      style   : 'currency',
                      currency: 'USD',
                    })}
                  </h4>
                )}
              </div>
              {transaction.type !== 'event' && (
                <div className = "glassjar__list-item-row glassjar__list-item__row--row2">
                  <h5>
                    {(transaction.type === 'withdrawal' ||
                      transaction.type === 'transfer') && (
                      <span>
                        {
                          accounts[
                            accounts.findIndex(
                              (account) => 
                                account.id === transaction.fromAccount
                            )
                          ].name
                        }
                      </span>
                    )}
                    {transaction.type === 'transfer' && (
                      <>
                        <br /> <i className = "fa-solid fa-angle-right" />{' '}
                      </>
                    )}
                    {(transaction.type === 'deposit' ||
                      transaction.type === 'transfer') && (
                      <span>
                        {
                          accounts[
                            accounts.findIndex(
                              (account) => account.id === transaction.toAccount
                            )
                          ].name
                        }
                      </span>
                    )}
                  </h5>
                  {floatingDate ? (
                    <h5 className = "glassjar__list-item__due">
                      due {format(fromDateKey(floatingDate), 'M/d/yy')}
                    </h5>
                  ) : (
                    annualSpend && (
                      <h5>
                        {(annualSpend / 100).toLocaleString('en-US', {
                          style   : 'currency',
                          currency: 'USD',
                        })}
                        /yr
                      </h5>
                    )
                  )}
                </div>
              )}
            </div>
            <div
              className = "glassjar__list-item__backing"
              style     = {{ background: accountColor }}
            />
          </div>

            <SwipeElement.Action action= {() => handleClear()}>
              <div className = "glassjar__swipe-icon">Clear</div>
            </SwipeElement.Action>
        </SwipeElement>
      </div>
    );
  }
);

export default TransactionListItem;

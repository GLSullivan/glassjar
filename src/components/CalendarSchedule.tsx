import React, { useCallback, useEffect, useState, useRef }  from 'react';
import { useDispatch, useSelector }                         from 'react-redux';

import { setActiveTransaction }                             from './../redux/slices/transactions';
import { getTransactionsByDateRange }                       from './../redux/slices/projections';
import { setActiveDate }                                    from './../redux/slices/activedates';
import { openTransactionModal }                             from './../redux/slices/modals';
import { RootState }                                        from './../redux/store';

import { Transaction }                                      from './../models/Transaction';
import TransactionListItem                                  from './TransactionListItem';

import './../css/TransactionList.css';
import { addMonths, endOfMonth, format, parseISO }          from 'date-fns';

import _ from 'lodash';

const CalendarSchedule: React.FC = () => {
  const dispatch                              = useDispatch();

  // const [scrollTimeout, setScrollTimeout]     = useState<number | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const activeDate                            = useSelector((state: RootState) => state.activeDates.activeDate);
  const today                                 = useSelector((state: RootState) => state.activeDates.today);
  const state                                 = useSelector((state: RootState) => state);

  const headerRefs                            = useRef(new Map<string, React.RefObject<HTMLDivElement>>());
  const loader                                = useRef<HTMLDivElement | null>(null);
  const containerRef                          = useRef<HTMLDivElement | null>(null);

  const [groupedTransactions, setGroupedTransactions] = useState<
    {
      date        : string;
      transactions: { transaction: Transaction; date: string }[];
    }[]
  >([]);

  // Fetch transactions on mount and when activeDate changes.
  useEffect(() => {
    setLoading(true);
    let limit = 36; // limiting to 36 months to avoid infinite loop.

    let   theDate        = format(new Date(today), 'yyyy-MM-dd');
    let   endOfMonthNext = format(endOfMonth(addMonths(parseISO(activeDate), 6)), 'yyyy-MM-dd');
    let   transactions   = getTransactionsByDateRange(state,theDate,endOfMonthNext);
    while (limit > 0 && (transactions.length < 20)) {
      endOfMonthNext = format(endOfMonth(addMonths(parseISO(endOfMonthNext), 1)), 'yyyy-MM-dd');
      transactions   = getTransactionsByDateRange(state,theDate,endOfMonthNext);
      limit--;
    }    
    setGroupedTransactions(transactions);
    setLoading(false);

  }, [activeDate, today, state]);

  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const getClosestDataDate = useCallback((): string | null => {
    const container = containerRef.current;
  
    if (!container) {
      return null;
    }
  
    const listChildren = Array.from(container.getElementsByClassName('glassjar__lazy-list-group'));
    if (listChildren.length === 0) {
      return null;
    }
  
    const containerTop = container.getBoundingClientRect().top;
  
    const closestDiv = listChildren.reduce((closest, current) => {
      const closestTop = closest.getBoundingClientRect().top - containerTop;
      const currentTop = current.getBoundingClientRect().top - containerTop;
  
      if (closestTop < 0) return current;  
      if (currentTop < 0) return closest;  
  
      return currentTop < closestTop ? current : closest;
    });

    return closestDiv.getAttribute('data-date') || null; 
  }, []);

  const handleUserScroll = () => {
    setIsUserScrolling(true);

    if (scrollTimeout.current !== null) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  };

  const throttledHandleUserScroll = _.throttle(handleUserScroll, 200);

  useEffect(() => {
    const events = ['scroll', 'touchmove', 'wheel'];
    events.forEach(event => window.addEventListener(event, throttledHandleUserScroll));

    return () => {
      events.forEach(event => window.removeEventListener(event, throttledHandleUserScroll));
    };
  }, [throttledHandleUserScroll]);

  useEffect(() => {
    if (activeDate) {
      const dateElements = Array.from(document.querySelectorAll('[data-date]'));
      const targetDate = new Date(activeDate).getTime();
      const sortedDateElements = dateElements.map(el => ({
        el,
        date: new Date(el.getAttribute('data-date') || '').getTime(),
      })).sort((a, b) => (
        Math.abs(targetDate - a.date) - Math.abs(targetDate - b.date)
      ));

      if (sortedDateElements.length > 0) {
        const nearestDateElement = sortedDateElements[0].el;
        nearestDateElement.scrollIntoView({
          behavior: 'smooth',
          block   : 'start',
          inline  : 'nearest',
        });
      }
    }
  }, [activeDate]);

  const observeHeaders = useCallback(() => {
    const closestDataDate = getClosestDataDate();
    if (closestDataDate !== null && isUserScrolling) {
      dispatch(setActiveDate(closestDataDate));
    }
  }, [dispatch, isUserScrolling, getClosestDataDate]);

  useEffect(() => {
    return observeHeaders();
  }, [observeHeaders]);


  return (
    <div ref = {containerRef} className = 'glassjar__schedule'>
      {groupedTransactions.length > 0 ?
        <>
          {groupedTransactions.map((group, groupIndex) => {
            if (!headerRefs.current.has(group.date)) {
              headerRefs.current.set(group.date, React.createRef());
            }
            return (
              <div id={group.date} data-date={group.date} key={groupIndex} className='glassjar__lazy-list-group' ref={headerRefs.current.get(group.date)}>
                <div
                  className='glassjar__lazy-list__header glassjar__flex glassjar__flex--justify-between'
                >
                  <h2 className='glassjar__calendar__month'>
                    {format(parseISO(group.date), 'MMMM do')}
                  </h2>
                  <button
                    onClick={() => {
                      dispatch(setActiveTransaction(null));
                      dispatch(openTransactionModal());
                    }}
                    className='glassjar__button glassjar__button--small' 
                  >
                    <i className='fa-solid fa-plus-minus' />
                  </button>
                </div>
                <div>
                  {group.transactions.map(({ transaction }, transactionIndex) => (
                    <TransactionListItem
                      key={`${groupIndex}-${transactionIndex}`}
                      transaction={transaction}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
        :
        <>
          <div
            className='glassjar__lazy-list__header glassjar__flex'
          >
            <h2 className='glassjar__calendar__month'>
              Create your first transaction!
            </h2>
            <button
              onClick={() => {
                dispatch(setActiveTransaction(null));
                dispatch(openTransactionModal());
              }}
              className='glassjar__button glassjar__button--small' 
            >
              <i className='fa-solid fa-plus-minus' />
            </button>
          </div>
        </>}
    
      <div ref = {loader} style = {{ minHeight: '1px' }} />
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default CalendarSchedule;
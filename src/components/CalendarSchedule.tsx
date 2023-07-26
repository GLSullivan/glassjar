import React, { useEffect, useState, useRef }  from 'react';
import { useDispatch, useSelector }                         from 'react-redux';

import { setActiveTransaction }                             from './../redux/slices/transactions';
import { getTransactionsByDateRange }                       from './../redux/slices/projections';
import { setActiveDate }                                    from './../redux/slices/activedates';
import { openTransactionModal }                             from './../redux/slices/modals';
import { RootState }                                        from './../redux/store';

import { Transaction }                                      from './../models/Transaction';
import TransactionListItem                                  from './TransactionListItem';

import './../css/TransactionList.css';
import { addDays, endOfMonth, format, parseISO }            from 'date-fns';

import _ from 'lodash';

const CalendarSchedule: React.FC = () => {
  const dispatch                                      = useDispatch();

  const [loading, setLoading]                         = useState(false);

  const activeDate                                    = useSelector((state: RootState) => state.activeDates.activeDate);
  const today                                         = useSelector((state: RootState) => state.activeDates.today);
  const state                                         = useSelector((state: RootState) => state);

  const headerRefs                                    = useRef(new Map<string, React.RefObject<HTMLDivElement>>());

  const loader                                        = useRef<HTMLDivElement | null>(null);
  const containerRef                                  = useRef<HTMLDivElement | null>(null);
  const timerRef                                      = useRef<number | null>(null);
  const scrollingRef                                  = useRef(false);

  const [groupedTransactions, setGroupedTransactions] = useState<{ date: string; transactions: { transaction: Transaction; date: string }[]; }[]>([]);

  // Fetch transactions on mount and when activeDate changes.
  useEffect(() => {
    setLoading(true);

    let startDate = format(new Date(today), 'yyyy-MM-dd');
    let endDate   = format(addDays(endOfMonth(parseISO(activeDate)), 10), 'yyyy-MM-dd');

    let transactions = getTransactionsByDateRange(state,startDate,endDate);

    setGroupedTransactions(transactions);
    setLoading(false);

  }, [activeDate, today, state]);

  // Find the date closest to the top of the container
  const getClosestDataDate = () => {
    console.log("Getting that date, yo!")
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
    
    const closestDataDate = closestDiv.getAttribute('data-date')
    
    if (closestDataDate !== null && closestDataDate !== activeDate) {
      dispatch(setActiveDate(closestDataDate));
    }

  };

  const [scrolling, setScrolling] = useState(false);

  const throttledHandleUserScroll = _.throttle(getClosestDataDate, 200);

  const handleScrollRef = useRef(() => {
    setScrolling(true);
    scrollingRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      scrollingRef.current = false;
      setScrolling(false);
    }, 1000); 

    throttledHandleUserScroll();
  });

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['scroll', 'touchmove', 'wheel'];
    const currentHandleScroll = handleScrollRef.current; // copy the ref to a variable
    events.forEach(event => window.addEventListener(event, currentHandleScroll));

    return () => {
      events.forEach(event => window.removeEventListener(event, currentHandleScroll));
    };
  }, []); // Removed handleScroll from dependencies, since it's stored in a ref now







  // Scroll to the active date when it is changed
  useEffect(() => {
    if (activeDate && !scrollingRef.current) {
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

  return (
    <div ref = {containerRef} className = 'glassjar__schedule'>
      <h5>{scrolling ? <span>True</span> : <span>False</span>} </h5>
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
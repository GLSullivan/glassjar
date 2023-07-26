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

  const [scrolling, setScrolling]                     = useState<boolean>(false);
  const [scrollPosition, setScrollPosition]           = useState<number>(0);
  const [loading, setLoading]                         = useState(false);
  
  const activeDate                                    = useSelector((state: RootState) => state.activeDates.activeDate);
  const today                                         = useSelector((state: RootState) => state.activeDates.today);
  const state                                         = useSelector((state: RootState) => state);

  const headerRefs                                    = useRef(new Map<string, React.RefObject<HTMLDivElement>>());
  const loader                                        = useRef<HTMLDivElement | null>(null);
  const containerRef                                  = useRef<HTMLDivElement | null>(null);
  const timerRef                                      = useRef<number | null>(null);
  const intervalRef                                   = useRef<number | null>(null);
  const scrollingRef                                  = useRef<boolean>(false);

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

  // Detect and react to use scrolling

  useEffect(() => {
    const updateScrollPosition = () => {
      if (containerRef.current) {
        setScrollPosition(containerRef.current.scrollTop);
      }
    };

    const intervalId = setInterval(() => {
      updateScrollPosition();
    }, 100);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Only run once, on mount

  useEffect(() => {
    let prevScrollPos = scrollPosition;

    // Set an interval to check if scrolling has stopped
    const checkIntervalId = setInterval(() => {
      if (prevScrollPos === scrollPosition) {
        clearInterval(checkIntervalId); 
        setScrolling(false);
        scrollingRef.current = false;
        getClosestDataDate();
      } else {
        prevScrollPos = scrollPosition;
      }
    }, 100);

    // Clean up interval on component unmount
    return () => clearInterval(checkIntervalId);
    // eslint-disable-next-line
  }, [scrollPosition]); 

  const handleScrollRef = useRef(() => {
    const throttledHandleUserScroll = _.throttle(getClosestDataDate, 100);

    setScrolling(true);
    scrollingRef.current = true;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }

    intervalRef.current = window.setInterval(throttledHandleUserScroll, 100);

    timerRef.current = window.setTimeout(() => {
      scrollingRef.current = false;
      setScrolling(false);

      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 3000);
  });

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['scroll', 'touchmove', 'wheel'];
    const currentHandleScroll = handleScrollRef.current;
    events.forEach(event => window.addEventListener(event, currentHandleScroll));

    return () => {
      events.forEach(event => window.removeEventListener(event, currentHandleScroll));
    };
  }, []); 

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
      <h5>{scrolling ? <span>True</span> : <span>False</span>} {scrollPosition}</h5>
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
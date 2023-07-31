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

const CalendarSchedule: React.FC = () => {
  const dispatch                                      = useDispatch();

  const [groupedTransactions, setGroupedTransactions] = useState<{ date: string; transactions: { transaction: Transaction; date: string }[]; }[]>([]);
  const [loading, setLoading]                         = useState(false);

  const activeDate                                    = useSelector((state: RootState) => state.activeDates.activeDate);
  const today                                         = useSelector((state: RootState) => state.activeDates.today);
  const state                                         = useSelector((state: RootState) => state);

  const headerRefs                                    = useRef(new Map<string, React.RefObject<HTMLDivElement>>());
  const scheduleWindow                                = useRef<HTMLDivElement | null>(null);
  const scrollTimeout                                 = useRef<NodeJS.Timeout | null>(null);
  const scrollInterval                                = useRef<NodeJS.Timeout | null>(null);
  const userInitiatedScroll                           = useRef<boolean>(false);

  // Fetch transactions on mount and when activeDate changes.
  useEffect(() => {
    setLoading(true);

    let   endDate        = format(addDays(endOfMonth(parseISO(activeDate)), 10), 'yyyy-MM-dd');
    let   startDate      = format(new Date(today), 'yyyy-MM-dd');
    let transactions = getTransactionsByDateRange(state,startDate,endDate);

    setGroupedTransactions(transactions);
    setLoading(false);

  }, [activeDate, today, state]);

  // Find the date closest to the top of the container
  const getClosestDataDate = () => {

    const container = scheduleWindow.current;
        
    if (!container) { return null; }
  
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
    const schedule = scheduleWindow.current;

    const scrollHandler = () => {
      console.log("scrollHandler");
      userInitiatedScroll.current = true;
      startInterval();
      startTimeout();
    };
  
    const touchEndHandler = () => {
      console.log("touchEndHandler");
      startTimeout();
    };
  
    const startTimeout = () => {
      // Clear any existing timeout
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      // Set a new timeout
      scrollTimeout.current = setTimeout(() => {
        console.log("Time setting it false.");
        userInitiatedScroll.current = false;
        stopInterval(); // Stop the interval when userInitiatedScroll is set to false
      }, 1000); // Adjust the delay as needed
    };
  
    const startInterval = () => {
      // Clear any existing interval
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      // Set a new interval
      scrollInterval.current = setInterval(() => {
        getClosestDataDate(); // Run your function every 100ms
      }, 100);
    };
  
    const stopInterval = () => {
      // Clear the interval
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  
    // Attaching the event listeners
    schedule?.addEventListener('touchstart', scrollHandler);
    schedule?.addEventListener('touchend', touchEndHandler);
    schedule?.addEventListener('mousedown', scrollHandler);
    schedule?.addEventListener('mouseup', scrollHandler);
    schedule?.addEventListener('wheel', scrollHandler);
  
    // Cleanup
    return () => {
      schedule?.removeEventListener('touchstart', scrollHandler);
      schedule?.removeEventListener('touchend', touchEndHandler);
      schedule?.removeEventListener('mousedown', scrollHandler);
      schedule?.removeEventListener('mouseup', scrollHandler);
      schedule?.removeEventListener('wheel', scrollHandler);
    };
    // eslint-disable-next-line
  }, []);
    
  // Scroll to the active date when it is changed
  useEffect(() => {

    if (userInitiatedScroll.current) { return } // Don't scroll if the date change came from elsewhere

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

  return (
    <div ref = {scheduleWindow} className = 'glassjar__schedule'>
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
          {loading && <p>Loading...</p>}
    </div>
  );
};

export default CalendarSchedule;
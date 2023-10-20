import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector }           from 'react-redux';

import { setActiveTransaction }               from './../redux/slices/transactions';
import { getTransactionsByDateRange }         from './../redux/slices/projections';
import { setActiveDate }                      from './../redux/slices/activedates';
import { openTransactionModal }               from './../redux/slices/modals';
import { RootState }                          from './../redux/store';

import { Transaction }                        from './../models/Transaction';
import { increaseGraphRange }                 from './../redux/slices/views';
import TransactionListItem                    from './TransactionListItem';

import { 
  endOfMonth, 
  format, 
  parseISO, 
  isAfter, 
  addMonths,
  startOfDay }                                 from 'date-fns';

import './../css/TransactionList.css';

const CalendarSchedule: React.FC = () => {
  const dispatch                                      = useDispatch();

  const [groupedTransactions, setGroupedTransactions] = useState<{ date: string; transactions: { transaction: Transaction; date: string }[]; }[]>([]);
  const [loading, setLoading]                         = useState(false);

  const activeDate                                    = useSelector((state: RootState) => state.activeDates.activeDate);
  const today                                         = useSelector((state: RootState) => state.activeDates.today);
  const projections                                   = useSelector((state: RootState) => state.projections);
  const graphRange                                    = useSelector((state: RootState) => state.views.graphRange);

  const headerRefs                                    = useRef(new Map<string, React.RefObject<HTMLDivElement>>());
  const scheduleWindow                                = useRef<HTMLDivElement | null>(null);
  const scrollTimeout                                 = useRef<NodeJS.Timeout | null>(null);
  const scrollInterval                                = useRef<NodeJS.Timeout | null>(null);
  const userInitiatedScroll                           = useRef<boolean>(false);

  // Fetch transactions on mount and when activeDate changes.
  useEffect(() => {
    setLoading(true);

    let startDate    = format(new Date(today), 'yyyy-MM-dd');
    let endDate      = format(addMonths(endOfMonth(parseISO(startDate)), graphRange), 'yyyy-MM-dd');
    let transactions = getTransactionsByDateRange(projections,startDate,endDate);

    // Filter and sort transactions within each day
    const sortedAndFilteredGroupedTransactions = transactions.map(group => ({
      ...group,
      transactions: group.transactions
        .filter(({ transaction }) => transaction.showInCalendar) // Filter out transactions not to be shown
        .sort((a, b) => b.transaction.amount - a.transaction.amount), // Sort remaining transactions by amount
    }));

    setGroupedTransactions(sortedAndFilteredGroupedTransactions); // Update the state with sorted and filtered transactions
    setLoading(false);
  }, [today, graphRange, projections]);

  // Find the date closest to the top of the container
  const getClosestDataDate = () => {
    const container = scheduleWindow.current;

    if (!container) {
      return null;
    }

    const listChildren = Array.from(
      container.getElementsByClassName('glassjar__lazy-list-group')
    );
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

    const closestDataDate = closestDiv.getAttribute('data-date');

    if (closestDataDate !== null && closestDataDate !== activeDate) {
      dispatch(setActiveDate(closestDataDate));
    }
  };

  useEffect(() => {
    if (activeDate && graphRange) {
      const today = startOfDay(new Date());
      if (isAfter(parseISO(activeDate), addMonths(today, graphRange))) {
        dispatch(increaseGraphRange());
      }
    }
    // eslint-disable-next-line
  }, [activeDate, graphRange]);
  
  // Detect and react to use scrolling
  useEffect(() => {
    const schedule = scheduleWindow.current;

    const scrollHandler = () => {
      userInitiatedScroll.current = true;
      startInterval();
      startTimeout();
    };
  
    const touchEndHandler = () => {
      startTimeout();
    };
  
    const startTimeout = () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        getClosestDataDate();
        userInitiatedScroll.current = false;
        stopInterval(); 
      }, 1000); 
    };
  
    const startInterval = () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
      scrollInterval.current = setInterval(() => {
        getClosestDataDate(); // Run your function every 100ms
      }, 100);
    };
  
    const stopInterval = () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  
    // Attaching the event listeners
    schedule?.addEventListener('touchstart', scrollHandler, { passive: true });
    schedule?.addEventListener('touchend', touchEndHandler, { passive: true });
    schedule?.addEventListener('mousedown', scrollHandler, { passive: true });
    schedule?.addEventListener('mouseup', scrollHandler, { passive: true });
    schedule?.addEventListener('wheel', scrollHandler, { passive: true });
  
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
                  <h3 className='glassjar__calendar__month'>
                    {format(parseISO(group.date), 'MMMM do')}
                  </h3>
                  <button
                    onClick={() => {
                      dispatch(setActiveDate(group.date))
                      dispatch(setActiveTransaction(null));
                      dispatch(openTransactionModal());
                    }}
                    className='glassjar__button glassjar__button--small' 
                  >
                    <i className='fa-solid fa-plus-minus' />
                  </button>
                </div>
                <div className='glassjar__flex glassjar__flex--column glassjar__flex--tight'>
                  {group.transactions.map(({ transaction }, transactionIndex) => (
                    <TransactionListItem
                      key          = {`${groupIndex}-${transactionIndex}`}
                      transaction  = {transaction}
                      instanceDate = {group.date}
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
            <h3 className='glassjar__calendar__month'>
              Create your first transaction!
            </h3>
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
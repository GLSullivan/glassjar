import React, { useCallback, useEffect, useState, useRef }  from 'react';
import { useDispatch, useSelector }                         from 'react-redux';

import { getTransactionsByDateRange }                       from '../redux/slices/projections';
import { setActiveTransaction }                             from "../redux/slices/transactions";
import { setActiveDate }                                    from '../redux/slices/activedates';
import { openTransactionModal }                             from "../redux/slices/modals";
import { RootState }                                        from '../redux/store';

import { Transaction }                                      from '../models/Transaction';
import TransactionListItem                                  from './TransactionListItem';

import './../css/TransactionList.css';
import { addMonths, endOfMonth, format, parseISO } from 'date-fns';

const CalendarSchedule: React.FC = () => {
  const dispatch                              = useDispatch();
  const [loading, setLoading]                 = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout]     = useState<number | null>(null);
  const state                                 = useSelector((state: RootState) => state);
  const loader                                = useRef<HTMLDivElement | null>(null);
  const headerRefs                            = useRef(new Map<string, React.RefObject<HTMLDivElement>>());
  const activeDate                            = useSelector((state: RootState) => state.activeDates.activeDate);
  const today                                 = useSelector((state: RootState) => state.activeDates.today);
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

    let   theDate        = format(new Date(today), "yyyy-MM-dd");
    const endOfMonthNext = format(endOfMonth(addMonths(parseISO(activeDate), 1)), "yyyy-MM-dd");
    const transactions   = getTransactionsByDateRange(state,theDate,endOfMonthNext);

    setGroupedTransactions(transactions);
    setLoading(false);

  }, [activeDate, today, state]);

  // Detect user scrolling
  useEffect(() => {
    const handleUserScroll = () => {
      setIsUserScrolling(true);
  
      if (scrollTimeout !== null) {
        clearTimeout(scrollTimeout);
      }
  
      setScrollTimeout(setTimeout(() => {
        setIsUserScrolling(false);
      }, 150) as unknown as number); // Adjust this delay to fit your needs
    };
  
    window.addEventListener('scroll', handleUserScroll);
    window.addEventListener('touchmove', handleUserScroll);
    window.addEventListener('wheel', handleUserScroll);
  
    return () => {
      window.removeEventListener('scroll', handleUserScroll);
      window.removeEventListener('touchmove', handleUserScroll);
      window.removeEventListener('wheel', handleUserScroll);
    };
  }, [scrollTimeout]);
  
  // Scroll to activeDate
  useEffect(() => {
    if (activeDate) {
      const dateId  = new Date(activeDate).toISOString().split("T")[0];
      const element = document.getElementById(dateId);
      
      if (element) {
        const parent = element.parentElement;
        if (parent) { // Check if parent is not null
          element.scrollIntoView({
            behavior: "smooth",
            block   : "start",
            inline  : "nearest",
          });
        }
      }
    }
  }, [activeDate]);
  
  // Set activeDate when user scrolls
  const observeHeaders = useCallback(() => {
    const scrollContainer = document.querySelector(".glassjar__schedule");
    if (!scrollContainer) return;

    let lastSetDate = "";

    const handleScroll = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (!containerRect || !isUserScrolling) return;

      headerRefs.current.forEach((ref, date) => {
        const current = ref.current;
        if (!current) return;

        const rect        = current.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        if (relativeTop <= 20 && relativeTop >= 0 && date !== lastSetDate) {
          lastSetDate = date;
          dispatch(setActiveDate(new Date(parseISO(date)).toISOString()));
        }
      });
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [dispatch, isUserScrolling]);

  useEffect(() => {
    return observeHeaders();
  }, [observeHeaders]);

  return (
    <div ref = {containerRef} className = "glassjar__schedule">

      {groupedTransactions.length > 0 ?
        <>
          {groupedTransactions.map((group, groupIndex) => {
            if (!headerRefs.current.has(group.date)) {
              headerRefs.current.set(group.date, React.createRef());
            }
            return (
              <div id={group.date} key={groupIndex} className="glassjar__lazy-list-group" ref={headerRefs.current.get(group.date)}>
                <div
                  className="glassjar__lazy-list__header glassjar__flex"
                >
                  <h2 className="glassjar__calendar__month">
                    {format(parseISO(group.date), "MMMM do")}
                  </h2>
                  <button
                    onClick={() => {
                      dispatch(setActiveTransaction(null));
                      dispatch(openTransactionModal());
                    }}
                    className="glassjar__button glassjar__button--small" 
                  >
                    <i className="fa-solid fa-plus-minus" />
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
            className="glassjar__lazy-list__header glassjar__flex"
          >
            <h2 className="glassjar__calendar__month">
              Create your first transaction!
            </h2>
            <button
              onClick={() => {
                dispatch(setActiveTransaction(null));
                dispatch(openTransactionModal());
              }}
              className="glassjar__button glassjar__button--small" 
            >
              <i className="fa-solid fa-plus-minus" />
            </button>
          </div>
        </>}
    
      <div ref = {loader} style = {{ minHeight: "1px" }} />
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default CalendarSchedule;
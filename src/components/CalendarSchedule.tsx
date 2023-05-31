import React, { useCallback, useEffect, useState, useRef }  from 'react';
import { useDispatch, useSelector }                         from 'react-redux';

import { RootState }                                        from '../redux/store';
import { getTransactionsByRange }                           from '../redux/slices/projections';
import TransactionListItem                                  from './TransactionListItem';
import { Transaction }                                      from '../models/Transaction';
import { setActiveTransaction }                             from "../redux/slices/transactions";
import { openTransactionModal }                             from "../redux/slices/modals";
import { setNearDate }                                      from '../redux/slices/activedates';

import './../css/TransactionList.css';

function groupTransactionsByDate(
  transactions: { transaction: Transaction; date: string }[]
) {

  const groupedTransactions: {
    date: string;
    transactions: { transaction: Transaction; date: string }[];
  }[] = [];

  transactions.forEach((transactionItem) => {
    // Create the date object and adjust for the timezone offset
    const transactionDate = new Date(transactionItem.date);

    // Store the date string in a variable
    const dateString = transactionDate.toISOString().split("T")[0];

    const existingGroup = groupedTransactions.find(
      (group) => group.date === dateString
    );

    if (existingGroup) {
      existingGroup.transactions.push(transactionItem);
    } else {
      groupedTransactions.push({
        date: dateString,
        transactions: [transactionItem],
      });
    }
  });
  return groupedTransactions;
}

const CalendarSchedule: React.FC = () => {
  const [transactionCount, setTransactionCount]       = useState(10);
  const [loading, setLoading]                         = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const loader                                        = useRef<HTMLDivElement | null>(null);
  const headerRefs                                    = useRef(new Map<string, React.RefObject<HTMLDivElement>>());
  const dispatch                                      = useDispatch();

  const transactions = useSelector((state: RootState) =>
    getTransactionsByRange(state, 0, transactionCount)
  );

  const groupedTransactions = groupTransactionsByDate(transactions);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    let newTransactionCount = transactionCount + 10;

    if (newTransactionCount >= 1000) {
      console.log("HALT for some reason.");
      setLoading(false);
      setHasMoreTransactions(false);
      return;
    }

    setTransactionCount(newTransactionCount);
  }, [transactionCount]);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const firstEntry = entries[0];
      if (firstEntry.isIntersecting) {
        fetchTransactions();
      }
    },
    [fetchTransactions]
  );
  
  useEffect(() => {
    if (loader.current && hasMoreTransactions) {
      const observerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: "0px",
        threshold: .10,
      };

      const observer = new IntersectionObserver(
        observerCallback,
        observerOptions
      );

      // Store the current loader reference in a variable
      const loaderCurrent = loader.current;
      observer.observe(loaderCurrent);

      return () => {
        // Use the copied reference in the cleanup function
        if (loaderCurrent) {
          observer.unobserve(loaderCurrent);
        }
      };
    }
  }, [loader, observerCallback, hasMoreTransactions]);

  // New observer to check when a new header is visible
  const observeHeaders = useCallback(() => {
    const scrollContainer = document.querySelector('.glassjar__schedule');
  
    if (!scrollContainer) return;
  
    let lastSetDate = '';
  
    const handleScroll = () => {
      headerRefs.current.forEach((ref, date) => {
        const current = ref.current;
        if (!current) return;
        const rect = current.getBoundingClientRect();
        if (rect.top <= 20 && rect.top >= 0 && date !== lastSetDate) {
          lastSetDate = date;
          console.log(date)
          dispatch(setNearDate(new Date(date).toISOString()));
        }
      });
    };
  
    scrollContainer.addEventListener('scroll', handleScroll);
  
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [dispatch]);
  
  useEffect(() => {
    return observeHeaders();
  }, [observeHeaders]);
  
  useEffect(() => {
    if (loader.current && hasMoreTransactions) {
      const observerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: "0px",
        threshold: .10,
      };

      const observer = new IntersectionObserver(
        observerCallback,
        observerOptions
      );
      const loaderCurrent = loader.current; 
      observer.observe(loaderCurrent);

      return () => {
        if (loaderCurrent) {
          observer.unobserve(loaderCurrent);
        }
      };
    }
  }, [loader, observerCallback, hasMoreTransactions]);

  useEffect(() => {
    setLoading(false);
  }, [transactionCount]);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    // eslint-disable-next-line
    const [year, month, day] = date.toISOString().split('T')[0].split('-');
  
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December',
    ];
  
    const getOrdinalSuffix = (n: number): string => {
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return 'st';
      if (mod10 === 2 && mod100 !== 12) return 'nd';
      if (mod10 === 3 && mod100 !== 13) return 'rd';
      return 'th';
    };
  
    const monthName = monthNames[parseInt(month, 10) - 1];
    const dayWithSuffix = parseInt(day, 10) + getOrdinalSuffix(parseInt(day, 10));
  
    return `${monthName} ${dayWithSuffix}`;
  }

  return (
    <div className='glassjar__schedule'>
      {/* <h1>Transactions By Date</h1> */}
      {groupedTransactions.map((group, groupIndex) => {
        if(!headerRefs.current.has(group.date)) {
          headerRefs.current.set(group.date, React.createRef());
        }
        return (
          <div key={groupIndex} className="glassjar__lazy-list-group">
            <div 
              id={group.date}
              ref={headerRefs.current.get(group.date)} 
              className="glassjar__lazy-list__header glassjar__flex"
            >
            <h2 className="glassjar__calendar__month">{formatDate(group.date)}</h2>
            <button
              onClick={() => {
                dispatch(setActiveTransaction(null));
                dispatch(openTransactionModal());
              }}
              className="button__new-transaction"
            >
              <i className="fa-solid fa-plus-minus" />
            </button>
            </div>
            {group.transactions.map(({ transaction }, transactionIndex) => (
              <TransactionListItem
                key={`${groupIndex}-${transactionIndex}`}
                transaction={transaction}
              />
            ))}
          </div>
        )
      })}
      <div ref={loader} style={{ minHeight: "1px" }} />
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default CalendarSchedule;
import React, { useCallback, useEffect, useState, useRef }  from 'react';
import { useSelector }                                      from 'react-redux';

import { RootState }                                        from '../redux/store';
import { getTransactionsByRange }                           from '../redux/slices/projections';
import TransactionListItem                                  from './TransactionListItem';
import { Transaction }                                      from '../models/Transaction';

import './../css/TransactionList.css';

function groupTransactionsByDate(
  transactions: { transaction: Transaction; date: string }[]
) {
  const groupedTransactions: {
    date        : string;
    transactions: { transaction: Transaction; date: string }[];
  }[] = [];

  transactions.forEach((transactionItem) => {
    // Create the date object and adjust for the timezone offset
    const transactionDate = new Date(transactionItem.date);
    console.log(transactionDate)
    const adjustedDate = new Date(transactionDate.getTime() - transactionDate.getTimezoneOffset() * 60 * 1000);
    console.log(transactionDate,adjustedDate)

    const existingGroup = groupedTransactions.find(
      (group) => group.date === adjustedDate.toISOString().split("T")[0]
    );

    if (existingGroup) {
      existingGroup.transactions.push(transactionItem);
    } else {
      groupedTransactions.push({
        date        : adjustedDate.toLocaleDateString(undefined, {month: 'long', day: 'numeric'}),
        transactions: [transactionItem],
      });
    }
  });

  return groupedTransactions;
}

const TransactionList: React.FC = () => {
  const [transactionCount, setTransactionCount]       = useState(10);
  const [loading, setLoading]                         = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);

  const loader = useRef<HTMLDivElement | null>(null);

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
        root      : null,
        rootMargin: "0px",
        threshold : 1.0,
      };

      const observer      = new IntersectionObserver(observerCallback, observerOptions);
      const loaderCurrent = loader.current;                                               // Copy the loader.current value to a variable
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

  return (
    <div>
      {groupedTransactions.map((group, groupIndex) => (
        <div key       = {groupIndex} className = "glassjar__lazy-list">
        <h4  className = "glassjar__lazy-list__header">{group.date}</h4>
          {group.transactions.map(({ transaction }, transactionIndex) => (
            <TransactionListItem
              key         = {`${groupIndex}-${transactionIndex}`}
              transaction = {transaction}
            />
          ))}    
        </div>
      ))}
      <div ref = {loader} style = {{ minHeight: '1px' }} />
      {loading && <p>Loading...</p>}
    </div>
  );
};
  
export default TransactionList;
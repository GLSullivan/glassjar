import React, { useCallback, useEffect, useRef, useState }  from 'react';
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
    const existingGroup = groupedTransactions.find(
      (group) => group.date === transactionItem.date
    );

    if (existingGroup) {
      existingGroup.transactions.push(transactionItem);
    } else {
      groupedTransactions.push({
        date        : transactionItem.date,
        transactions: [transactionItem],
      });
    }
  });

  return groupedTransactions;
}

function isLastDateGroupComplete(
  transactions: { transaction: Transaction; date: string }[]
) {
  if (transactions.length < 2) {
    return false;
  }

  const lastTransactionDate       = transactions[transactions.length - 1].date;
  const secondLastTransactionDate = transactions[transactions.length - 2].date;

  return lastTransactionDate !== secondLastTransactionDate;
}

const TransactionList: React.FC = () => {
  const [transactionCount, setTransactionCount]       = useState(10);
  const [loading, setLoading]                         = useState(false);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true); // New state variable
  const observer                                      = useRef<IntersectionObserver | null>(null);

  const transactions = useSelector((state: RootState) =>
    getTransactionsByRange(state, 0, transactionCount)
  );

  const groupedTransactions = groupTransactionsByDate(transactions);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    let newTransactionCount = transactionCount + 10;
  
    if (newTransactionCount >= 1000) {
      console.log('HALT for some reason.');
      setLoading(false);
      setHasMoreTransactions(false);
      return;
    }
  
    setTransactionCount(newTransactionCount);
  }, [transactionCount]); // Add the dependency array to useCallback
  
  useEffect(() => {
    if (!loading || !hasMoreTransactions) {
      return;
    }
  
    const fetchNewTransactions = async (transactions: any) => {
      const isComplete = isLastDateGroupComplete(transactions);
  
      if (!isComplete) {
        fetchTransactions();
      } else {
        setLoading(false);
        setHasMoreTransactions(false);
      }
    };
  
  fetchNewTransactions(transactions);                                                                        // Pass transactions as a parameter
  }                   , [loading, transactionCount, hasMoreTransactions, transactions, fetchTransactions]);  // Add the fetchTransactions dependency
  
  const loadingRef = useCallback(
    (node: HTMLDivElement | null) => {
      console.log("We're loading?",transactionCount)
      if (loading || !hasMoreTransactions) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchTransactions();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMoreTransactions, fetchTransactions, transactionCount]  // Add the fetchTransactions dependency
  );

  return (
    <div>
      {groupedTransactions.map((group, groupIndex) => (
        <div key       = {groupIndex} className = 'glassjar__lazy-list'>
        <h4  className = 'glassjar__lazy-list__header'>{group.date}</h4>
          {group.transactions.map(({ transaction }, transactionIndex) => (
            <TransactionListItem
              key         = {`${groupIndex}-${transactionIndex}`}
              transaction = {transaction}
            />
          ))}
        </div>
      ))}
      <div ref = {loadingRef} />?
    </div>
  );
};

export default TransactionList;
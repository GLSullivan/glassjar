import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState }        from '../redux/store';
import { setSearchString } from './../redux/slices/search';
import { TransactionType } from './../utils/constants';

import TransactionListItem from './TransactionListItem';
import Menu from './Menu';

import './../css/TransactionList.css';
import { Transaction } from '../models/Transaction';
import { getSpendByTransaction } from '../redux/slices/projections';

interface TransactionListProps {
  transactions   ?: Transaction[];
  isCollapsible  ?: boolean;
  collapseControl?: boolean;
}

type FilterOption = {
  id: number;
  label: string;
  type: TransactionType;
};

type SortOption = {
  id: number;
  label: string;
};

const TransactionList: React.FC<TransactionListProps> = ({
    transactions: propTransactions,
    isCollapsible,
    collapseControl, 
  }) => {
  const dispatch = useDispatch();
  const projections    = useSelector((state: RootState) => state.projections);

  const reduxTransactions = useSelector(
    (state: RootState) => state.transactions.transactions
  );

  const allTransactions = propTransactions || reduxTransactions;

  const [transactions, setTransactions] = useState(allTransactions);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState<number[]>([]);
  const [sort, setSort]                 = useState<number | null>(2);

  const options: FilterOption[] = [
    { id: 1, label: 'Deposit', type: TransactionType.DEPOSIT },
    { id: 2, label: 'Withdrawal', type: TransactionType.WITHDRAWAL },
    { id: 3, label: 'Transfer', type: TransactionType.TRANSFER },
    { id: 4, label: 'Event', type: TransactionType.EVENT },
  ];

  const sortOptions: SortOption[] = [
    { id: 1, label: 'A to Z' },
    { id: 2, label: 'High to Low' },
    { id: 3, label: 'Low to High' },
    { id: 4, label: 'Account To' },
    { id: 5, label: 'Account From' },
    { id: 6, label: 'Category' },
    { id: 7, label: 'Annual High to Low' },
    { id: 8, label: 'Annual Low to High' },
  ];

  const handleCheckboxChange = (optionId: number) => {
    const updatedFilter = filter.includes(optionId)
      ? filter.filter((id) => id !== optionId)
      : [...filter, optionId];

    setFilter(updatedFilter);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSort = Number(event.target.value);
    setSort(selectedSort);
  };

  const handleSearchChange = (term: string) => {
    setSearch(term);
    dispatch(setSearchString(term));
  };

  const applyFilterAndSort = () => {
    let filteredTransactions = allTransactions;

    // Apply filter
    if (filter.length > 0) {
      filteredTransactions = filteredTransactions.filter((t) => {
        const option = options.find((o) => o.type === t.type);
        return option ? filter.includes(option.id) : false;
      });
    }

    // Apply sort
    if (sort) {
      filteredTransactions = filteredTransactions.slice();

      switch (sort) {
        case 1: // Alphabetically
          filteredTransactions.sort((a, b) =>
            a.transactionName.localeCompare(b.transactionName)
          );
          break;
        case 2: // Amount High to Low
          filteredTransactions.sort((a, b) => b.amount - a.amount);
          break;
        case 3: // Amount Low to High
          filteredTransactions.sort((a, b) => a.amount - b.amount);
          break;
        case 4: // Account To
          filteredTransactions.sort((a, b) =>
            (a.toAccount || '').localeCompare(b.toAccount || '')
          );
          break;
        case 5: // Account From
          filteredTransactions.sort((a, b) =>
            (a.fromAccount || '').localeCompare(b.fromAccount || '')
          );
          break;
        case 6: // Category
          filteredTransactions.sort((a, b) =>
            (a.category || '').localeCompare(b.category || '')
          );
          break;
          case 7: // Annual Spend High to Low
          filteredTransactions.sort((a, b) => {
            const spendA = getSpendByTransaction(projections, a.event_id) || 0;
            const spendB = getSpendByTransaction(projections, b.event_id) || 0;
            return spendB - spendA;
          });
          break;
        case 8: // Annual Spend Low to High
          filteredTransactions.sort((a, b) => {
            const spendA = getSpendByTransaction(projections, a.event_id) || 0;
            const spendB = getSpendByTransaction(projections, b.event_id) || 0;
            return spendA - spendB;
          });
          break;
        default:
          break;
      }
    }

    // Apply search
    if (search) {
      filteredTransactions = filteredTransactions.filter((t) =>
        t.transactionName.toLowerCase().includes(search.toLowerCase())
      );
    }

    setTransactions(filteredTransactions);
  };

  useEffect(() => {
    applyFilterAndSort();
    // eslint-disable-next-line
  }, [filter, sort, search, allTransactions]);

  return (
    <div className='glassjar__transaction-list'>
      {allTransactions.length > 3 &&
        <div className='glassjar__transaction-list__header'>

          <div className='glassjar__search-sort'>
            <div className='glassjar__search-sort__field  glassjar__form__input-group'>
              <input
                type='text'
                id='searchTerm'
                placeholder='Search...'
                value={search || ''}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
              <label htmlFor='searchTerm'>Search...</label>
              {search !== '' && (
                <div
                  className='glassjar__search-sort__field-clear'
                  onClick={() => handleSearchChange('')}
                >
                  <i className='fa-solid fa-circle-x' />
                </div>
              )}
            </div>
            <Menu className='glassjar__sort-menu'>
              <Menu.Button>
                <i className='fa-regular fa-bars-filter' />
              </Menu.Button>
              <Menu.Body>
                <p>Sort Transactions</p>
                <div className='glassjar__form__input-group glassjar__form__input-group--drop'>
                  <select value={sort || ''} onChange={handleSortChange} id='sort'>
                    <option value=''>None</option>
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                    <label htmlFor='sort'>Sort:</label>
                </div>
                <br />
                <p>Show Only</p>
                <div className='glassjar__sort-menu__filter'>
                  {options.map((option) => (
                    <div key={option.id} className='glassjar__form__input-group glassjar__form__input-group--check'>
                      <input
                        type='checkbox'
                        className='glassjar__checkbox'
                        value={option.id}
                        checked={filter.includes(option.id)}
                        // defaultChecked
                        id={'filter' + option.id}
                        onChange={() =>
                          option.id && handleCheckboxChange(option.id)
                        }
                      />
                      <label htmlFor={'filter' + option.id}>{option.label}</label>
                    </div>
                  ))}
                </div>
              </Menu.Body>
            </Menu>
          </div>
        </div>
      }

      <div className='glassjar__transaction-view glassjar__flex glassjar__flex--column glassjar__flex--tight'>
        {transactions.slice(0, 3).map((transaction) => (
          <TransactionListItem
            key={transaction.event_id}
            transaction={transaction}
            showSearch={true}
          />
        ))}

        {isCollapsible && (
          <div
            className={`glassjar__auto-height glassjar__auto-height--top ${
              collapseControl ? 'open' : ''
            }`}
          >
            <div className='glassjar__flex glassjar__flex--column glassjar__flex--tight'>
              {transactions.slice(3).map((transaction) => (
                <TransactionListItem
                  key={transaction.event_id}
                  transaction={transaction}
                  showSearch={true}
                />
              ))}
              </div>
          </div>
        )}

        {!isCollapsible &&
          transactions.slice(3).map((transaction) => (
            <TransactionListItem
              key={transaction.event_id}
              transaction={transaction}
              showSearch={true}
            />
          ))}
      </div>
    </div>
  );
};

export default TransactionList;

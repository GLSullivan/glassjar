import React, { useEffect, useState }  from "react";
import { useSelector }      from "react-redux";

import { RootState }        from "../redux/store";
import TransactionListItem  from "./TransactionListItem";

import "./../css/TransactionList.css";

type FilterOption = {
  id: number;
  label: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'event';
};

type SortOption = {
  id: number;
  label: string;
};

const TransactionList: React.FC = () => {
  const allTransactions = useSelector(
    (state: RootState) => state.transactions.transactions
  );

  const [transactions, setTransactions] = useState(allTransactions);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState<number[]>([]);
  const [sort, setSort]                 = useState<number | null>(2);

  const options: FilterOption[] = [
    { id: 1, label: "Deposit", type: 'deposit' },
    { id: 2, label: "Withdrawal", type: 'withdrawal' },
    { id: 3, label: "Transfer", type: 'transfer' },
    { id: 4, label: "Event", type: 'event' },
  ];

  const sortOptions: SortOption[] = [
    { id: 1, label: "Alphabetically" },
    { id: 2, label: "Amount High to Low" },
    { id: 3, label: "Amount Low to High" },
    { id: 4, label: "Account To" },
    { id: 5, label: "Account From" },
    { id: 6, label: "Category" },
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const applyFilterAndSort = () => {
    let filteredTransactions = allTransactions;

    // Apply filter
    if (filter.length > 0) {
      filteredTransactions = filteredTransactions.filter(t => {
        const option = options.find(o => o.type === t.type);
        return option ? filter.includes(option.id) : false;
      });
    }

    // Apply sort
    if (sort) {

      filteredTransactions = filteredTransactions.slice();

      switch(sort) {
        case 1: // Alphabetically
          filteredTransactions.sort((a, b) => a.transactionName.localeCompare(b.transactionName));
          break;
        case 2: // Amount High to Low
          filteredTransactions.sort((a, b) => b.amount - a.amount);
          break;
        case 3: // Amount Low to High
          filteredTransactions.sort((a, b) => a.amount - b.amount);
          break;
        case 4: // Account To
          filteredTransactions.sort((a, b) => (a.toAccount || '').localeCompare(b.toAccount || ''));
          break;
        case 5: // Account From
          filteredTransactions.sort((a, b) => (a.fromAccount || '').localeCompare(b.fromAccount || ''));
          break;
        case 6: // Category
          filteredTransactions.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
          break;
        default:
          break;
      }
    }
  
      // Apply search
      if (search) {
        filteredTransactions = filteredTransactions.filter(t =>
          t.transactionName.toLowerCase().includes(search.toLowerCase())
        );
      }
  
      setTransactions(filteredTransactions);
    };
  
    useEffect(() => {
      applyFilterAndSort();
      // eslint-disable-next-line eqeqeq
    }, [filter, sort, search, allTransactions]);
  
    return (
      <>
        <div>
          <input type="text" placeholder="Search..." value={search} onChange={handleSearchChange}></input>
          <div>
            <label>Sort By:</label>
            <select value={sort || ""} onChange={handleSortChange}>
              <option value="">None</option>
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <table>
              <tbody>
                {options.map((option) => (
                  <tr key={option.id}>
                    <td>
                      <label>{option.label}</label>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={filter.includes(option.id)}
                        onChange={() => option.id && handleCheckboxChange(option.id)}
                        />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="glassjar__transaction-view">
          {transactions.map((transaction, index) => (
            <TransactionListItem key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </>
    );
  };
  
  export default TransactionList;
  
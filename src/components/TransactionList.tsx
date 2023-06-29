import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../redux/store";
import { setSearchString } from "./../redux/slices/search";
import { TransactionType } from './../utils/constants';

import TransactionListItem from "./TransactionListItem";
import Menu from "./Menu";

import * as Checkbox from "@radix-ui/react-checkbox";

import "./../css/TransactionList.css";

type FilterOption = {
  id: number;
  label: string;
  type: TransactionType;
};

type SortOption = {
  id: number;
  label: string;
};

const TransactionList: React.FC = () => {
  const dispatch = useDispatch();

  const allTransactions = useSelector(
    (state: RootState) => state.transactions.transactions
  );

  const [transactions, setTransactions] = useState(allTransactions);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<number[]>([]);
  const [sort, setSort] = useState<number | null>(2);

  const options: FilterOption[] = [
    { id: 1, label: "Deposit", type: "deposit" },
    { id: 2, label: "Withdrawal", type: "withdrawal" },
    { id: 3, label: "Transfer", type: "transfer" },
    { id: 4, label: "Event", type: "event" },
  ];

  const sortOptions: SortOption[] = [
    { id: 1, label: "A to Z" },
    { id: 2, label: "High to Low" },
    { id: 3, label: "Low to High" },
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
            (a.toAccount || "").localeCompare(b.toAccount || "")
          );
          break;
        case 5: // Account From
          filteredTransactions.sort((a, b) =>
            (a.fromAccount || "").localeCompare(b.fromAccount || "")
          );
          break;
        case 6: // Category
          filteredTransactions.sort((a, b) =>
            (a.category || "").localeCompare(b.category || "")
          );
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
    <div className="glassjar__transaction-list">
      <div className="glassjar__transaction-list__header">
        <h2>Transactions</h2>
        <div className="glassjar__search-sort">
          <div className="glassjar__search-sort__field">
            <input
              type="text"
              placeholder="Search..."
              value={search || ""}
              onChange={(event) => handleSearchChange(event.target.value)}
            />
            {search !== "" && (
              <div
                className="glassjar__search-sort__field-clear"
                onClick={() => handleSearchChange("")}
              >
                <i className="fa-solid fa-circle-x" />
              </div>
            )}
          </div>
          <Menu className="glassjar__sort-menu">
            <Menu.Button>
              <i className="fa-regular fa-bars-filter" />
            </Menu.Button>
            <Menu.Body>
              <p>Sort By</p>
              <div className="glassjar__form__input-group glassjar__form__input-group--drop">
                <label htmlFor=""></label>
                <select value={sort || ""} onChange={handleSortChange}>
                  <option value="">None</option>
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <br />
              <p>Show Only</p>
              <div className="glassjar__sort-menu__filter">
                {options.map((option) => (
                  <div key={option.id} className="glassjar__flex glassjar__flex--justify-between">
                    <label htmlFor={"filter" + option.id}>{option.label}</label>

                    <Checkbox.Root
                      className="glassjar__checkbox"
                      value={option.id}
                      checked={filter.includes(option.id)}
                      // defaultChecked
                      id={"filter" + option.id}
                      onCheckedChange={() =>
                        option.id && handleCheckboxChange(option.id)
                      }
                    >
                      <Checkbox.Indicator className="glassjar__checkbox__indicator">
                        <i className="fa-solid fa-check"></i>
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                  </div>
                ))}
              </div>
            </Menu.Body>
          </Menu>
        </div>
      </div>

      <div className="glassjar__transaction-view">
        {transactions.map((transaction, index) => (
          <TransactionListItem
            key={transaction.id}
            transaction={transaction}
            showSearch={true}
          />
        ))}
      </div>
    </div>
  );
};

export default TransactionList;

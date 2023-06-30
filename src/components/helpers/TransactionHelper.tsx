import React from "react";
import MiniTransactionForm from "../forms/MiniTransactionForm";
import { RecurringExpenses } from "../../data/RecurringExpenses";

import Tabs from "../Tabs";
import HolidayHelper from "./HolidayHelper";
import BirthdayHelper from "./BirthdayHelper";

const Loader: React.FC = () => {
  return (
    <>
      <h2>Transaction Helper</h2>
      <p>
        This tool helps you quickly fill out your recurring transactions,
        birthdays, and holiday expenses.
      </p>
      <Tabs>
        <Tabs.Item heading="Expenses">
          {RecurringExpenses.map((categoryItem, index) => (
            <div key={index}>
              {categoryItem.category !== "None" && (
                <p>{categoryItem.category}</p>
              )}
              <div>
                {categoryItem.expenses.map(
                  (expense, expenseIndex) =>
                    categoryItem.category !== "None" && (
                      <MiniTransactionForm
                        key={expenseIndex}
                        initialCategory={categoryItem.category}
                        initialName={expense}
                        initialDay="1"
                      />
                    )
                )}
              </div>
            </div>
          ))}
        </Tabs.Item>
        <Tabs.Item heading="Holidays">
          <HolidayHelper />
        </Tabs.Item>
        <Tabs.Item heading="Birthdays">
          <BirthdayHelper />
        </Tabs.Item>
      </Tabs>
    </>
  );
};

export default Loader;

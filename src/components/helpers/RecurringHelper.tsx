import React from "react";
import { useSelector } from "react-redux";

import { RootState } from "../../redux/store";
import MiniTransactionForm from "../forms/MiniTransactionForm";
import { RecurringExpenses } from "../../data/RecurringExpenses";

const RecurringHelper: React.FC = () => {

  const allTransactions = useSelector(
    (state: RootState) => state.transactions.transactions
  );

  return (
    <>
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
    </>
  );
};

export default RecurringHelper;

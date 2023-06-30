import React from "react";

import MiniTransactionForm from "../forms/MiniTransactionForm";
import { RecurringExpenses } from "../../data/RecurringExpenses";

const RecurringHelper: React.FC = () => {

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

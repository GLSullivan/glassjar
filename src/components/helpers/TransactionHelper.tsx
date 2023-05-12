import React                 from "react";
import MiniTransactionForm   from "../forms/MiniTransactionForm";
import { RecurringExpenses } from "../../data/RecurringExpenses";

const Loader: React.FC = () => {

  return (
    <>
      <h2>Let's get you started.</h2>
      <p>
        Enter your recurring transactions. Not sure about something? Just guess!
      </p>
      <p>
        If you don't see something here, adding it later is easy. No worries.
      </p>

      {RecurringExpenses.map((categoryItem, index) => (
          <div key={index}>
            <h3>{categoryItem.category}</h3>
            <div>
              {categoryItem.expenses.map((expense, expenseIndex) => (
                <MiniTransactionForm key={expenseIndex} initialCategory={categoryItem.category} initialName={expense} initialDay="1" />
              ))}
            </div>
          </div>
      ))}
    </>
  );
};

export default Loader;

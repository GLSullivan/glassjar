import React                from "react";
import MiniTransactionForm  from "../forms/MiniTransactionForm";


import { useSelector }  from "react-redux";
import { RootState }    from "./../../redux/store";

import { recurringExpenses } from "../../data/RecurringExpenses";

const Loader: React.FC = () => {

  return ( 
    <div>
      <h2>Let's get you started.</h2>
      <p>Enter your recurring transactions. Not sure about something? Just guess!</p>
      <p>If you don't see something here, adding it later is easy. No worries.</p>

      {recurringExpenses.map((categoryItem, index) => (
<>



        <div key={index} className="category">
          <h3>{categoryItem.category}</h3>
          <ul>
            {categoryItem.expenses.map((expense, expenseIndex) => (
<MiniTransactionForm key={expenseIndex} initialName={expense} initialDay="1" />
              // <li key={expenseIndex}>{expense}</li>
              ))}
          </ul>
        </div>
              </>
      ))}

    </div>
  );
};

export default Loader;

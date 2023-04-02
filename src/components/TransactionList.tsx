import React                          from 'react';
import { useSelector, useDispatch }   from 'react-redux'

import { RootState }                  from '../redux/store';

export const TransactionList: React.FC = () => {

  const activeDate = useSelector((state: RootState) => state.activeDate.value)
  
  return (
    <div>
      <h3>Transactions {new Date(activeDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}</h3>
      <button>Add Transaction</button>
    </div>
  );
};

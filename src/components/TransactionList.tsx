import React                          from 'react';
import { useSelector, useDispatch }   from 'react-redux'

import { RootState }                  from '../redux/store';
import { openTransactionModal }       from './../redux/slices/modals'

export const TransactionList: React.FC = () => {

  const activeDate = useSelector((state: RootState) => state.activeDate.activeDate)
  const dispatch = useDispatch();

  return (
    <div>
      <h3>Transactions {new Date(activeDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}</h3>
      <button onClick={() => dispatch(openTransactionModal())}>Add Transaction</button>
    </div>
  );
};

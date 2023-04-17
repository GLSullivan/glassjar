import { useSelector, useDispatch }                     from 'react-redux';
import React, { useEffect, useState, PureComponent }    from 'react';
import { RootState }                                    from './redux/store';        
import { AccountList }                                  from './components/AccountList';
import Calendar                                         from './components/Calendar';
import { TransactionList }                              from './components/DayPanel';
import Modal                                            from './components/Modal';
import TransactionForm                                  from './components/forms/TransactionForm';
import { ProjectedBalances }                            from './components/ProjectedBalances';
import { Account }                                      from './models/Account'
import { Transaction }                                  from './models/Transaction';
import { AccountForm }                                  from './components/forms/AccountForm';
import Loader                                           from './components/Loader';
import { closeTransactionModal, 
        closeAccountForm,
        closeAccountList,
        openAccountList,
        openAccountForm }                               from './redux/slices/modals'
import { recalculateProjections, selectBalanceByDateAndAccount }                       from './redux/slices/projections';


import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';



 // import Swiper JS
 import { Swiper, SwiperSlide } from "swiper/react";
 import { Navigation, Pagination } from "swiper";

 // import Swiper styles
 import 'swiper/css';
 import "swiper/css/navigation";
 import "swiper/css/pagination";

const AppContent: React.FC = () => {
  const transactionOpen = useSelector((state: RootState) => state.modalState.transactionFormOpen)
  const accountListOpen = useSelector((state: RootState) => state.modalState.accountListOpen)
  const accountFormOpen = useSelector((state: RootState) => state.modalState.accountFormOpen)
  const activeDate      = useSelector((state: RootState) => state.activeDates.activeDate)
  const farDate         = useSelector((state: RootState) => state.activeDates.farDate);
  const transactions    = useSelector((state: RootState) => state.transactions.transactions);

  const accounts = useSelector((state: RootState) => state.accounts.accounts);

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(recalculateProjections({ transactions, farDate }));
  }, [transactions, farDate, dispatch]);

  const closeTheTransactionModal = () => {
    dispatch(closeTransactionModal())
  }

  const closeTheAccountList = () => {
    dispatch(closeAccountList())
  }

  const closeTheAccountForm = () => {
    dispatch(closeAccountForm())
  }

  if (accounts.length < 1) {
    dispatch(openAccountForm()); //Half-assed initial setup. 
  }

  
function clearLocalStorage() {
  localStorage.removeItem('accounts');
  localStorage.removeItem('transactions');
}

const state = useSelector((state: RootState) => state);

const data: number | number[] = selectBalanceByDateAndAccount(state,state.accounts.accounts[0],true,state.activeDates.today,state.activeDates.farDate) 







  return (
    <div className="glassjar__root">
      <Loader />
      <Modal isOpen={accountListOpen} onClose={closeTheAccountList}>
        <AccountList />
      </Modal>
      <Modal
        isOpen={accountFormOpen}
        onClose={closeTheAccountForm}
        hideClose={accounts.length < 1}
      >
        <AccountForm />
      </Modal>
      <Modal isOpen={transactionOpen} onClose={closeTheTransactionModal}>
        <TransactionForm
          initialDate={activeDate}
          onClose={closeTheTransactionModal}
        />
      </Modal>
      <Calendar />
      <Swiper
        // navigation={true}
        // pagination={true}
        // modules={[Navigation, Pagination]}
        className="glassjar__swiper"
      >
        <SwiperSlide>
          <div className="slide__holder">
            <TransactionList />
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slide__holder">
            <AccountList />
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slide__holder">
            <h3
              onClick={() => {
                dispatch(openAccountList());
              }}
            >
              <i className="fa-solid fa-file-invoice-dollar" />
            </h3>
            <h3 onClick={() => clearLocalStorage()}>
              <i className="fa-solid fa-floppy-disk-circle-xmark" />
            </h3>
          </div>
        </SwiperSlide>
        <SwiperSlide>
        <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>        </SwiperSlide>
      </Swiper>
      {/* <ProjectedBalances accounts={projectedAccounts} date={selectedDate} /> */}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppContent />
  );
};

export default App;

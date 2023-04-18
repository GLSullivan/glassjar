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
import { recalculateProjections, 
         selectBalanceByDateAndAccount }                from './redux/slices/projections';
import OutlookGraph                                     from './components/OutlookGraph'




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
            <OutlookGraph />
          </div>
        </SwiperSlide>
        <SwiperSlide>
          <div className="slide__holder">
            <h1>Dev Tools Menu</h1>
            <h3 onClick={() => clearLocalStorage()}>  Clear Local Storage<i className="fa-solid fa-floppy-disk-circle-xmark" /></h3>
          </div>
        </SwiperSlide>
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

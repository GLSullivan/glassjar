import React from "react";
import { useSelector } from "react-redux";

import { RootState } from "../../redux/store";
import { FutureHolidays } from "./../../data/FutureHolidays";
import HolidayTransactionForm from "../forms/HolidayTransactionForm";

const HolidayHelper: React.FC = () => {

  const allTransactions = useSelector(
    (state: RootState) => state.transactions.transactions
  );

  return (
    <>
      {FutureHolidays.map((holiday, index) => {
        const activeTransaction = allTransactions.find(
          (transaction) => 
            transaction.transactionName === holiday.name && transaction.fromHelper === "holiday"
        );
        const isActive = Boolean(activeTransaction);
        return (
          <HolidayTransactionForm
            key={index}
            initialCategory="Charity and Gifts"
            initialName={holiday.name}
            initialArbitraryDates={holiday.next_occurrence}
            isActive={isActive}
            initialActiveTransaction={activeTransaction}
            initialFromHelper="holiday"
          />
        );
      })}
    </>
  );
};

export default HolidayHelper;

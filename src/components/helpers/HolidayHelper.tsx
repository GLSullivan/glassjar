import React from "react";
import { FutureHolidays } from "./../../data/FutureHolidays";
import HolidayTransactionForm from "../forms/HolidayTransactionForm";

const HolidayHelper: React.FC = () => {
  return (
    <>
      {FutureHolidays.map((holiday, index) => (
        <HolidayTransactionForm
          key={index}
          initialCategory="Charity and Gifts"
          initialName={holiday.name}
          initialArbitraryDates={holiday.next_occurrence}
        />
      ))}
    </>
  );
};

export default HolidayHelper;

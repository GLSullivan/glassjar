import React from "react";

import Tabs from "./../Tabs";
import HolidayHelper from "./HolidayHelper";
import BirthdayHelper from "./BirthdayHelper";
import RecurringHelper from "./RecurringHelper";

const Loader: React.FC = () => {
  return (
    <>
      <h2>Transaction Helper</h2>
      <p>
        This tool helps you quickly fill out your recurring transactions,
        birthdays, and holiday expenses.
      </p>
      <Tabs>
        <Tabs.Item heading="Expenses">
          <RecurringHelper />
        </Tabs.Item>
        <Tabs.Item heading="Holidays">
          <HolidayHelper />
        </Tabs.Item>
        <Tabs.Item heading="Birthdays">
          <BirthdayHelper />
        </Tabs.Item>
      </Tabs>
    </>
  );
};

export default Loader;

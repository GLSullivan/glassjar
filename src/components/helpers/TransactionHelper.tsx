import React from 'react';

import Tabs from './../Tabs';
import HolidayHelper from './HolidayHelper';
import BirthdayHelper from './BirthdayHelper';
import RecurringHelper from './RecurringHelper';
import { closeTransactionHelper } from '../../redux/slices/modals';
import PanelHeader from '../PanelHeader';
import { useDispatch } from 'react-redux';

const Loader: React.FC = () => {
  const dispatch = useDispatch();

  return (
    <>
      <PanelHeader
        title='Transaction Helper'
        onSecondaryAction={() => dispatch(closeTransactionHelper())}
        secondaryActionLabel='Close'
        showPrimaryButton={false}
      />
      <div className='glassjar__padding'>
        <p>
          This tool helps you quickly fill out your recurring transactions,
          birthdays, and holiday expenses.
        </p>
        <Tabs>
          <Tabs.Item heading='Expenses'>
            <RecurringHelper />
          </Tabs.Item>
          <Tabs.Item heading='Holidays'>
            <HolidayHelper />
          </Tabs.Item>
          <Tabs.Item heading='Birthdays'>
            <BirthdayHelper />
          </Tabs.Item>
        </Tabs>
      </div>
    </>
  );
};

export default Loader;

import React, { useState } from 'react';
import { useSelector, useDispatch }                     from 'react-redux';

import CalendarMonth from './CalendarMonth';
import CalendarSchedule from './CalendarSchedule';
import { RootState } from '../redux/store';
import { setCalendarView }            from '../redux/slices/views';

const CalendarSelector: React.FC = () => {
  const dispatch = useDispatch()

  const handleViewChange = (view: string) => {
    dispatch(setCalendarView(view))
  };

  const calendarView = useSelector((state: RootState) => state.views.calendarView);

  return (
    <div className='glassjar__calendar-group'>
      <div className="glassjar__calendar-selector">
        <i onClick={() => handleViewChange('Month')}   className={`fa-duotone fa-calendar-days${ calendarView === 'Month' ? " selected" : ""}`} />
        <i onClick={() => handleViewChange('Schedule')} className={`fa-duotone fa-list${ calendarView === 'Schedule' ? " selected" : ""}`} />
        </div>
        <div className="glassjar__calendar-holder">
          {calendarView === 'Month' ? (
            <CalendarMonth />
          ) : (
            <CalendarSchedule />
          )}
        </div>
    </div>
  );
};

export default CalendarSelector;

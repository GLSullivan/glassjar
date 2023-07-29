import React             from 'react';

import CalendarSchedule  from './CalendarSchedule';
import CalendarMonth     from './CalendarMonth';
import OutlookGraph      from './OutlookGraph';

const CalendarSelector: React.FC = () => {
  return (
    <div className='glassjar__calendar-group'>
      <CalendarMonth />
      <div className='glassjar__calendar__day-panel--graph'>
        <OutlookGraph />
      </div>
      <div className='glassjar__calendar__day-panel'>
        <CalendarSchedule />
      </div>
    </div>
  );
};

export default CalendarSelector;

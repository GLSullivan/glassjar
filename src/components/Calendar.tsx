import React             from 'react';

import CalendarSchedule  from './CalendarSchedule';
import CalendarMonth     from './CalendarMonth';
import OutlookGraph      from './OutlookGraph';
import Tabs              from './Tabs';

import { DayPanel } from './panels/DayPanel';

const CalendarSelector: React.FC = () => {
  return (
    <div className='glassjar__calendar-group'>
      <CalendarMonth />
      <div className='glassjar__calendar__day-panel--graph'>
        <OutlookGraph />
      </div>
      <div className='glassjar__calendar__day-panel'>

        <Tabs>
          <Tabs.Item heading='Schedule'>
            <CalendarSchedule />
          </Tabs.Item>
          <Tabs.Item heading='Projections'>
            <DayPanel/>
          </Tabs.Item>
        </Tabs>

      </div>
    </div>
  );
};

export default CalendarSelector;

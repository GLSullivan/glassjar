import React, { useState } from 'react';
import CalendarMonth from './CalendarMonth';
import CalendarSchedule from './CalendarSchedule';

type CalendarView = 'Month' | 'Schedule';

const CalendarSelector: React.FC = () => {
const [calendarView, setCalendarView] = useState("Month")

  const handleViewChange = (selected: string) => {
    // const selected = event.target.value as CalendarView;
    setCalendarView(selected);
  };

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

import React                                            from 'react';
import { useSelector, useDispatch }                     from 'react-redux';

import CalendarMonth                                    from './CalendarMonth';
import CalendarSchedule                                 from './CalendarSchedule';
import { RootState }                                    from '../redux/store';
import { setCalendarView }                              from '../redux/slices/views';

const CalendarSelector: React.FC = () => {
  const dispatch = useDispatch()

  const handleViewChange = (view: string) => {
    dispatch(setCalendarView(view))
  };

  const calendarView = useSelector((state: RootState) => state.views.calendarView);
  return (
    <div className='glassjar__calendar-group'>
      <div className='glassjar__schedule__view-control'>
        <div onClick={() => handleViewChange('month')} className={`glassjar__calendar-view-button${calendarView === 'Month' ? ' selected' : ''}`}><i className='fa-duotone fa-calendar-days' /></div>
        <div onClick={() => handleViewChange('schedule')} className={`glassjar__calendar-view-button${calendarView === 'Schedule' ? ' selected' : ''}`}><i className='fa-duotone fa-list' /></div>
      </div>
        {/* <div className='glassjar__calendar-holder'> */}
          {calendarView === 'month' ? (
            <CalendarMonth />
          ) : (
            <CalendarSchedule />
          )}
        {/* </div> */}
    </div>
  );
};

export default CalendarSelector;

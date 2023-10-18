import { useSelector, useDispatch }   from 'react-redux';
import React, { useState, useEffect } from 'react';

import { useSwipeable }               from 'react-swipeable';
import { addDays, 
  addMonths, 
  addWeeks, 
  endOfWeek, 
  format, 
  getDay, 
  isAfter,
  isBefore, 
  isSameDay, 
  isWithinInterval, 
  startOfDay, 
  startOfMonth, 
  startOfWeek, 
  subDays, 
  subMonths,
  subWeeks }                          from 'date-fns';

import { setActiveDate }              from './../redux/slices/activedates';
import { dateHasTransactions }        from './../redux/slices/projections';
import { increaseGraphRange,
  setCalendarView }                   from './../redux/slices/views';
import { RootState }                  from './../redux/store';
import CalendarDay                    from './CalendarDay';

import './../css/Calendar.css';

// Constants
const dayNames       = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const startDayOfWeek = 0; // 0 for Sunday, 1 for Monday, etc.

const CalendarMonth: React.FC = () => {
  const dispatch   = useDispatch();

  // Redux store selectors
  const activeDate   = useSelector((state: RootState) => state.activeDates.activeDate);
  const today        = useSelector((state: RootState) => state.activeDates.today);
  const calendarView = useSelector((state: RootState) => state.views.calendarView);
  const projections  = useSelector((state: RootState) => state.projections);
  const graphRange   = useSelector((state: RootState) => state.views.graphRange);
  
  const showCalendar: boolean = false; // TODO: Make this a user pref or use it to toggle.

  const activeDateObj = new Date(activeDate);

  const handleViewChange = () => {
    // Toggle between 'month' and 'week'
    const newView = calendarView === 'month' ? 'week' : 'month';
    dispatch(setCalendarView(newView));
  };

  // Rotated day names to allow users to choose the first day of the week
  const rotatedDayNames = dayNames
    .slice(startDayOfWeek)
    .concat(dayNames.slice(0, startDayOfWeek));

  // Function to change the month based on the given direction
  const changeDate = (direction: 'next' | 'previous') => {
    let newDate: Date = new Date(activeDate);

    if (direction === 'next') {
      if (calendarView === 'month' || !showCalendar) {
        newDate = addMonths(newDate, 1);
        newDate = startOfMonth(newDate); 

      } else if (calendarView === 'week') {
        newDate = addWeeks(newDate, 1);
      }
    } else {
      if (calendarView === 'month' || !showCalendar) {
        newDate = subMonths(newDate, 1);
      } else if (calendarView === 'week') {
        newDate = subWeeks(newDate, 1);
        newDate = startOfMonth(newDate); 
      }
    }

    const today = startOfDay(new Date());

    if (isBefore(newDate, today)) {
      newDate = today;
    }

    dispatch(setActiveDate(newDate.toISOString()));

    if (isAfter(newDate, addMonths(today, graphRange))) {
      dispatch(increaseGraphRange());
    }

  };

    // Swipe handlers for changing the month
  const swipeHandlers = useSwipeable({
    onSwipedLeft : () => changeDate('next'),
    onSwipedRight: () => changeDate('previous'),
  });

  // Function to generate the days array
  const generateDaysArray = (month: Date, startDay: number) => {
    const firstDayOfMonth = startOfMonth(month);
    const offset = (getDay(firstDayOfMonth) - startDay + 7) % 7 || 7;
    const firstDayOfGrid = subDays(firstDayOfMonth, offset + 1);
  
    const daysArray: Date[] = [];
  
    for (let i = 0; i < 42; i++) {
      daysArray.push(addDays(firstDayOfGrid, i + 1));
    }
  
    return daysArray;
  };
  
  // Update days array when the active date changes
  useEffect(() => {
    setDays(generateDaysArray(new Date(activeDate), startDayOfWeek));
  }, [activeDate]);

  const [days, setDays] = useState<Date[]>(generateDaysArray(activeDateObj, startDayOfWeek));

  // Function to check if a week contains the active date
  const isDateInWeek = (activeDate: Date, weekDate: Date) => {
    const start = startOfWeek(weekDate);
    const end = endOfWeek(weekDate);

    return isWithinInterval(activeDate, { start, end });
  }

  // Function to chunk the array into smaller arrays of the given size
  function chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  return (
    <div className='glassjar__calendar__container' {...swipeHandlers}>
      <div className='glassjar__calendar__navigation'>
        <button onClick={() => changeDate('previous')}>
          <i className='fa-regular fa-chevron-left' />
        </button>
        <h2
          className='glassjar__calendar__month'
          onClick={() => { dispatch(setActiveDate(startOfDay(new Date()).toISOString())); }}
        >
          {format(activeDateObj, 'MMMM yyyy')}
        </h2>
        <button onClick={() => changeDate('next')}>
          <i className='fa-regular fa-chevron-right' />
        </button>
      </div>
      {showCalendar && 
      <>
        <div className='glassjar__calendar__calendar'>
          <div className='glassjar__calendar__seven-row glassjar__calendar__seven-row--header'>
            {rotatedDayNames.map((dayName, index) => (
              <div key={index} className='glassjar__calendar__header-day'>
                {dayName}
              </div>
            ))}
          </div>
          {chunk(days, 7).map((week: Date[], weekIndex: number) => (
            <div key={weekIndex} className={`glassjar__calendar__week glassjar__auto-height${(isDateInWeek(week[0], new Date(activeDate)) || calendarView === 'month') ? ' open' : '' }`} >
              <div key={weekIndex} className={`glassjar__calendar__seven-row${isDateInWeek(week[0], new Date(activeDate)) ? ' active' : '' }`}>
                {week.map((day: Date, dayIndex: number) => {
                  return (
                    <CalendarDay
                      key            = {day.toISOString()}
                      day            = {day}
                      isCurrentMonth = {day.getMonth() === activeDateObj.getMonth()}
                      isToday        = {isSameDay(day, new Date(today))}
                      isActive       = {isSameDay(day, new Date(activeDate))}
                      hasTransaction = {
                        dateHasTransactions(projections, day.toISOString().slice(0, 10))
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className='glassjar__calendar-toggle'>
            <button
              onClick={() => handleViewChange()}
              className='glassjar__button glassjar__button__calendar-toggle glassjar__button--small'
            >
              <i className={`fa-regular fa-down-to-line ${calendarView === 'month' ? 'open' : ''}`} />
            </button>
          </div>
          
        </div>
      </>}
      
    </div>
  );
};

export default CalendarMonth;

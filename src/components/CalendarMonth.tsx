import { useSelector, useDispatch }   from 'react-redux';
import React, { useState, useEffect } from 'react';

import { useSwipeable }               from 'react-swipeable';
import { addDays, 
  addMonths, 
  endOfWeek, 
  format, 
  getDay, 
  isBefore, 
  isSameDay, 
  isWithinInterval, 
  startOfDay, 
  startOfMonth, 
  startOfWeek, 
  subDays, 
  subMonths }                         from 'date-fns';

import { setActiveDate }              from '../redux/slices/activedates';
import { dateHasTransactions }        from '../redux/slices/projections';
import { RootState }                  from '../redux/store';

// import { DayPanel }                   from './panels/DayPanel';
import OutlookGraph                   from './OutlookGraph';
import CalendarSchedule               from './CalendarSchedule';
import CalendarDay                    from './CalendarDay';

import './../css/Calendar.css';

  // Constants
const dayNames       = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const startDayOfWeek = 0; // 0 for Sunday, 1 for Monday, etc.

const CalendarMonth: React.FC = () => {
  const state                           = useSelector((state: RootState) => state);
  const dispatch                        = useDispatch();

  // Redux store selectors
  const activeDate    = useSelector((state: RootState) => state.activeDates.activeDate);
  const today         = useSelector((state: RootState) => state.activeDates.today);
  const activeDateObj = new Date(activeDate);

  // Rotated day names to allow users to choose the first day of the week
  const rotatedDayNames = dayNames
    .slice(startDayOfWeek)
    .concat(dayNames.slice(0, startDayOfWeek));

  // Function to change the month based on the given direction
  const changeMonth = (direction: 'next' | 'previous') => {
    let newMonth;
    if (direction === 'next') {
      newMonth = addMonths(activeDateObj, 1);
    } else {
      newMonth = subMonths(activeDateObj, 1);
    }

    newMonth = startOfMonth(newMonth); // Ensure the date is set to the first of the month

    const today = startOfDay(new Date());
    if (isBefore(newMonth, today)) {
      newMonth = today;
    }

    dispatch(setActiveDate(newMonth.toISOString()));
  };

    // Swipe handlers for changing the month
  const swipeHandlers = useSwipeable({
    onSwipedLeft : () => changeMonth('next'),
    onSwipedRight: () => changeMonth('previous'),
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
        <button onClick={() => changeMonth('previous')}>
          <i className='fa-regular fa-chevron-left' />
        </button>
        <h2
          className='glassjar__calendar__month'
          onClick={() => { dispatch(setActiveDate(startOfDay(new Date()).toISOString())); }}
        >
          {format(activeDateObj, 'MMMM yyyy')}
        </h2>
        <button onClick={() => changeMonth('next')}>
          <i className='fa-regular fa-chevron-right' />
        </button>
      </div>
      <div className='glassjar__calendar__calendar'>
        <div className='glassjar__calendar__seven-row glassjar__calendar__seven-row--header'>
          {rotatedDayNames.map((dayName, index) => (
            <div key={index} className='glassjar__calendar__header-day'>
              {dayName}
            </div>
          ))}
        </div>
        {chunk(days, 7).map((week: Date[], weekIndex: number) => (
          // <div
          //   key={weekIndex}
          //   className={`glassjar__calendar__week glassjar__auto-height${isDateInWeek(week[0], new Date(activeDate))
          //       ? ' open'
          //       : ''
          //     }`}
          // >
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
                      dateHasTransactions(state, day.toISOString().slice(0, 10))
                    }
                  />
                );
              })}
            </div>
          // </div>
        ))}
      </div>
      <div className='glassjar__calendar__day-panel--graph'>
        <OutlookGraph />
      </div>
      <div className='glassjar__calendar__day-panel'>
        {/* <DayPanel /> */}
        <CalendarSchedule />
      </div>
    </div>
  );
};

export default CalendarMonth;

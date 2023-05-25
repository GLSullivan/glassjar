import { useSelector, useDispatch }   from 'react-redux';
import React, { useState, useEffect } from 'react';

import { useSwipeable }               from 'react-swipeable';

import { setFarDate, setNearDate }    from '../redux/slices/activedates';
import { dateHasTransactions }        from '../redux/slices/projections';
import { DayPanel }                   from './panels/DayPanel';
import { RootState }                  from '../redux/store';
import CalendarDay                    from './CalendarDay';

import './../css/Calendar.css';

  // Constants
const dayNames       = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const startDayOfWeek = 0; // 0 for Sunday, 1 for Monday, etc.

const CalendarMonth: React.FC = () => {
  const dispatch                        = useDispatch();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Redux store selectors
  const state = useSelector((state: RootState) => state);

  const activeDate = useSelector(
    (state: RootState) => state.activeDates.activeDate
  );
  const today                = useSelector((state: RootState) => state.activeDates.today);
  const farDate              = useSelector((state: RootState) => state.activeDates.farDate);

  // Rotated day names to allow users to choose the first day of the week
  const rotatedDayNames = dayNames
    .slice(startDayOfWeek)
    .concat(dayNames.slice(0, startDayOfWeek));

    // Function to change the month based on the given direction
  const changeMonth = (direction: 'next' | 'previous') => {
    setTimeout(() => {
      if (direction === 'next') {
        const newMonth = new Date(
          currentMonth.setMonth(currentMonth.getMonth() + 1)
        );
        const farDateMinusTwoMonths = new Date(
          new Date(farDate).setMonth(new Date(farDate).getMonth() - 2)
        );

        if (newMonth > farDateMinusTwoMonths) {
          const futureMonth = new Date(newMonth);
          futureMonth.setMonth(futureMonth.getMonth() + 2);
          dispatch(setFarDate(futureMonth.toISOString()));
        }
        setCurrentMonth(new Date(newMonth));
        dispatch(setNearDate(new Date(newMonth).toISOString()));
      } else {
        setCurrentMonth(
          new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
        );
      }
    }, 600);
  };

    // Swipe handlers for changing the month
  const swipeHandlers = useSwipeable({
    onSwipedLeft : () => changeMonth('next'),
    onSwipedRight: () => changeMonth('previous'),
  });

    // Function to generate the days array
  const generateDaysArray = (month: Date, startDay: number) => {
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0);
    const firstDayOfGrid  = new Date(firstDayOfMonth);
    const offset          = (firstDayOfMonth.getDay() - startDay + 7) % 7 || 7;

    firstDayOfGrid.setDate(firstDayOfGrid.getDate() - offset - 1);

    const daysArray: Date[] = [];

    for (let i = 0; i < 42; i++) {
      daysArray.push(
        new Date(firstDayOfGrid.setDate(firstDayOfGrid.getDate() + 1))
      );
    }

    return daysArray;
  };

  const [days, setDays] = useState<Date[]>(
    generateDaysArray(currentMonth, startDayOfWeek)
  );

    // Function to check if two dates are the same
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.toISOString().slice(0, 10) === date2.toISOString().slice(0, 10)
    );
  };

    // Function to check if a week contains the active date
  const containsActiveDate = (week: Date[], activeDate: Date) => {
    return week.some((day) => isSameDay(day, activeDate));
  };

    // Function to chunk the array into smaller arrays of the given size
  function chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

    // Update days array when the current month or start day of the week changes
  useEffect(() => {
    setDays(generateDaysArray(currentMonth, startDayOfWeek));
  }, [currentMonth]);

  return (
    <div className='glassjar__calendar__container' {...swipeHandlers}>
      <div className='glassjar__calendar__navigation'>
        <button onClick={() => changeMonth('previous')}>
          <i className='fa-regular fa-chevron-left' />
        </button>
        <h2
          className='glassjar__calendar__month'
          onClick={() => { setCurrentMonth(new Date()); dispatch(setNearDate(new Date(new Date()).toISOString())) }}
        >
          {currentMonth.toLocaleString('default', { month: 'long' })}{' '}
          {currentMonth.getFullYear()}
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
          <div
            key={weekIndex}
            className={`glassjar__calendar__week${containsActiveDate(week, new Date(activeDate))
                ? ' active'
                : ''
              }`}
          >
            <div className="glassjar__calendar__seven-row">
              {week.map((day: Date, dayIndex: number) => {
                return (
                  <CalendarDay
                    key={day.toISOString()}
                    day={day}
                    isCurrentMonth={day.getMonth() === currentMonth.getMonth()}
                    isToday={isSameDay(day, new Date(today))}
                    isActive={isSameDay(day, new Date(activeDate))}
                    hasTransaction={
                      dateHasTransactions(state, day.toISOString().slice(0, 10))
                    }
                  />
                );
              })}
            </div>
            <div className="glassjar__calendar__inline-panel">
              <div>
                <DayPanel />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarMonth;
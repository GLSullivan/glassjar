import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch }   from 'react-redux'

import { RootState }                  from './../redux/store';
import { setActiveDate }              from './../redux/slices/activedate'

import './../css/Calendar.css';

const Calendar: React.FC = () => {
  const activeDate = useSelector((state: RootState) => state.activeDate.value)
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const generateDaysArray = (month: Date) => {
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const firstDayOfGrid = new Date(firstDayOfMonth);
    firstDayOfGrid.setDate(firstDayOfGrid.getDate() - firstDayOfGrid.getDay());

    const daysArray: Date[] = [];

    for (let i = 0; i < 42; i++) {
      daysArray.push(new Date(firstDayOfGrid.setDate(firstDayOfGrid.getDate() + 1)));
    }

    return daysArray;
  };

  const [days, setDays] = useState<Date[]>(generateDaysArray(currentMonth));

  useEffect(() => {
    setDays(generateDaysArray(currentMonth));
  }, [currentMonth]);

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentMonth.getMonth() && day.getFullYear() === currentMonth.getFullYear();
  };

  const weeksVisibility = (month: Date) => {
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const lastDayOfWeek = lastDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate() + firstDayOfWeek + (lastDayOfWeek !== 6 ? (6 - lastDayOfWeek) : 0);
    const totalWeeks = Math.ceil(totalDays / 7);
    return Array.from({ length: 6 }, (_, i) => i < totalWeeks);
  };

  const weekVisibility = weeksVisibility(currentMonth);
  const dispatch = useDispatch()
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  function chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  return (
    <div className='calendar__container'>
      <div className='calendar__navigation'>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
          Previous
        </button>
        <h2 className="calendar__month" onClick={() => setCurrentMonth(new Date())}>
          {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
        </h2>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
          Next
        </button>
      </div>
      <div className="calendar__calendar">
        {chunk(days, 7).map((week: Date[], weekIndex: number) => (
          <div key={weekIndex} className="calendar__week">
            {week.map((day: Date) => (
              <button
                key={day.toISOString()}
                onClick={() => dispatch(setActiveDate(day.toISOString()))}
                className={`calendar__day${!isCurrentMonth(day) ? ' calendar__day--other-month' : ''}${isSameDay(day,new Date()) ? ' calendar__day--today' : ''}${isSameDay(day,new Date(activeDate)) ? ' calendar__day--active' : ''}`}
              >
                {day.getDate()}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;

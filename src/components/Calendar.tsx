import React, { useState, useEffect } from 'react';
import './../css/Calendar.css';

interface CalendarProps {
  onSelectDate: (date: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ onSelectDate }) => {
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
  
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

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
        {days.map((day, index) => (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day.toISOString().split('T')[0])}
            className={`calendar__day${!isCurrentMonth(day) ? ' calendar__day--other-month' : ''
              }${isToday(day) ? ' calendar__day--today' : ''}`}
            style={{ visibility: weekVisibility[Math.floor(index / 7)] ? 'visible' : 'hidden' }}
          >
            {day.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar;

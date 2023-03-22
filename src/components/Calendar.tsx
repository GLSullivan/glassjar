import React, { useState } from 'react';
import './../css/Calendar.css';

interface CalendarProps {
    onSelectDate: (date: string) => void;
  }

const Calendar: React.FC<CalendarProps> = ({ onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateDays = (month: number, year: number) => {
    const days = [];
    const totalDays = daysInMonth(month, year);

    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = generateDays(currentMonth.getMonth(), currentMonth.getFullYear());

  return (
    <div className='container'>
      <div className='navigation'>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
          Previous
        </button>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
          Next
        </button>
      </div>
      <div className='calendar'>
        {days.map((day) => (
          <button key={day.toISOString()} onClick={() => onSelectDate(day.toISOString().split('T')[0])} className='day'>
            {day.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calendar;

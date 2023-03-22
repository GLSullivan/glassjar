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

  const [days, setDays] = useState<Date[]>(() => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const firstDayOfGrid = new Date(firstDayOfMonth);
    firstDayOfGrid.setDate(firstDayOfGrid.getDate() - firstDayOfGrid.getDay());
  
    const daysArray: Date[] = [];
  
    for (let i = 0; i < 42; i++) { // 42 days cover 6 weeks of the grid
      daysArray.push(new Date(firstDayOfGrid.setDate(firstDayOfGrid.getDate() + 1)));
    }
  
    return daysArray;
  });
  
  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentMonth.getMonth() && day.getFullYear() === currentMonth.getFullYear();
  };
  
  const getMonthName = (date: Date) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };


  
  return (
    <div className='container'>
      <div className='navigation'>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>
          Previous
        </button>
        <span>{getMonthName(currentMonth)}</span>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>
          Next
        </button>
        </div>
    <div className="calendar">
      {days.map((day) => (
        <button
          key={day.toISOString()}
          onClick={() => onSelectDate(day.toISOString().split('T')[0])}
          className={`day ${!isCurrentMonth(day) ? 'other-month-day' : ''}`}
        >
          {day.getDate()}
        </button>
      ))}
    </div>
  </div>
);
};

export default Calendar;

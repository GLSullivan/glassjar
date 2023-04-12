import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch }   from 'react-redux'
import { RootState }                  from './../redux/store';
import { setActiveDate }              from './../redux/slices/activedates'

import "./../css/Calendar.css";

const Calendar: React.FC = () => {
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const startDayOfWeek = 0; // 0 for Sunday, 1 for Monday, etc.

  const activeDate = useSelector(
    (state: RootState) => state.activeDates.activeDate
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const rotatedDayNames = dayNames
    .slice(startDayOfWeek)
    .concat(dayNames.slice(0, startDayOfWeek));
  const hasTransactionByDate = useSelector(
    (state: RootState) => state.projections.hasTransaction
  );

  const generateDaysArray = (month: Date, startDay: number) => {
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
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

  useEffect(() => {
    setDays(generateDaysArray(currentMonth, startDayOfWeek));
    console.log(hasTransactionByDate)
  }, [currentMonth, startDayOfWeek]);

  const isCurrentMonth = (day: Date) => {
    return (
      day.getMonth()    === currentMonth.getMonth() &&
      day.getFullYear() === currentMonth.getFullYear()
    );
  };

  const dispatch = useDispatch();

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate()     === date2.getDate() &&
      date1.getMonth()    === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  function chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  return (
    <div className="calendar__container">
      <div className="calendar__navigation">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
            )
          }
        >
          <i className="fa-regular fa-chevron-left" />
        </button>
        <h2
          className="calendar__month"
          onClick={() => setCurrentMonth(new Date())}
        >
          {currentMonth.toLocaleString("default", { month: "long" })}{" "}
          {currentMonth.getFullYear()}
        </h2>
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
            )
          }
        >
        <i className="fa-regular fa-chevron-right" />
        </button>
      </div>
      <div className="calendar__calendar">
        <div className="calendar__header-row">
          {rotatedDayNames.map((dayName, index) => (
            <div key={index} className="calendar__header-day">
              {dayName}
            </div>
          ))}
        </div>
        {chunk(days, 7).map((week: Date[], weekIndex: number) => (
          <div key={weekIndex} className="calendar__week">
            {week.map((day: Date) => (
              <button
                key={day.toISOString()}
                onClick={() => dispatch(setActiveDate(day.toISOString()))}
                className={`calendar__day${
                  !isCurrentMonth(day) ? " calendar__day--other-month" : ""
                }${isSameDay(day, new Date()) ? " calendar__day--today" : ""}${
                  isSameDay(day, new Date(activeDate))
                    ? " calendar__day--active"
                    : ""
                }${
                  hasTransactionByDate[day.toISOString().split("T")[0]]
                    ? " calendar__day--has-transaction"
                    : ""
                }`}
              >
                <div>
                  {day.getDate()}
                  {hasTransactionByDate[day.toISOString().split("T")[0]] && <div className='calendar__day__marker'></div>}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;

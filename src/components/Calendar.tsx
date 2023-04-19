import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch }   from 'react-redux'
import { RootState }                  from './../redux/store';
import { setFarDate }                 from './../redux/slices/activedates'
import CalendarDay                    from './CalendarDay'
import { useSwipeable }               from "react-swipeable";

import "./../css/Calendar.css";

const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
const startDayOfWeek = 0; // 0 for Sunday, 1 for Monday, etc.

const Calendar: React.FC = () => {
  const dispatch = useDispatch();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const activeDate           = useSelector((state: RootState) => state.activeDates.activeDate);
  const today                = useSelector((state: RootState) => state.activeDates.today);
  const farDate              = useSelector((state: RootState) => state.activeDates.farDate);
  const hasTransactionByDate = useSelector((state: RootState) => state.projections.dayHasTransaction);

  const rotatedDayNames = dayNames // ToDo: allow users to choose first day of week.
    .slice(startDayOfWeek)
    .concat(dayNames.slice(0, startDayOfWeek));
    
        const changeMonth = (direction: "next" | "previous") => {
          setTimeout(() => {
            if (direction === "next") {
              let newMonth = new Date(
                currentMonth.setMonth(currentMonth.getMonth() + 1)
              );
              let farDateMinusTwoMonths = new Date(
                new Date(farDate).setMonth(new Date(farDate).getMonth() - 2)
              );
              if (newMonth > farDateMinusTwoMonths) {
                let futureMonth = new Date(newMonth);
                futureMonth.setMonth(futureMonth.getMonth() + 2);
                dispatch(setFarDate(futureMonth.toISOString()));
              }
              setCurrentMonth(
                new Date(newMonth)
              );
            } else {
              setCurrentMonth(
                new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
              );
            }
          }, 600);
        };

    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => changeMonth("next"),
      onSwipedRight: () => changeMonth("previous"),
    });

  const generateDaysArray = (month: Date, startDay: number) => {
    const firstDayOfMonth = new Date(month.getFullYear(),month.getMonth(), 1,0,0,0,0);
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

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.toISOString().slice(0, 10) === date2.toISOString().slice(0, 10)
    );
  };

  const containsActiveDate = (week: Date[], activeDate: Date) => {
    return week.some((day) => isSameDay(day, activeDate));
  };  

  function chunk<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  useEffect(() => {
    setDays(generateDaysArray(currentMonth, startDayOfWeek));
  }, [currentMonth, startDayOfWeek]);

  return (
    <div className="calendar__container" {...swipeHandlers}>
      <div className="calendar__navigation">
        <button
           onClick={() => changeMonth("previous")}
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
         onClick={() => changeMonth("next")}
        >
          <i className="fa-regular fa-chevron-right" />
        </button>
      </div>
      <div
        className="calendar__calendar"
      >        
      <div className="calendar__header-row">
          {rotatedDayNames.map((dayName, index) => (
            <div key={index} className="calendar__header-day">
              {dayName}
            </div>
          ))}
        </div>
        {chunk(days, 7).map((week: Date[], weekIndex: number) => (
          <div
            key={weekIndex}
            className={`calendar__week${containsActiveDate(week, new Date(activeDate)) ? " calendar__week--active" : ""}`}
          >
           {week.map((day: Date, dayIndex: number) => {
      const dayOfMonthIndex = weekIndex * 7 + dayIndex;
      return (
        <CalendarDay
          key={day.toISOString()}
          day={day}
          isCurrentMonth={day.getMonth() === currentMonth.getMonth()}
          isToday={isSameDay(day, new Date(today))}
          isActive={isSameDay(day, new Date(activeDate))}
          hasTransaction={
            hasTransactionByDate[day.toISOString().slice(0, 10)]
          }
        />
      );
    })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;

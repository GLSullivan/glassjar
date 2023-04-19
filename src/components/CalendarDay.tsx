import React              from "react";
import { useDispatch }    from "react-redux";
import { setActiveDate }  from "./../redux/slices/activedates";

import "./../css/Calendar.css";

interface CalendarDayProps {
  day            : Date;
  isCurrentMonth : boolean;
  isToday        : boolean;
  isActive       : boolean;
  hasTransaction : boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = React.memo(
  ({ day, isCurrentMonth, isToday, isActive, hasTransaction }) => {
    const dispatch  = useDispatch();
    const className = [
      "calendar__day",
      !isCurrentMonth ? "calendar__day--other-month"    : "",
      isToday         ? "calendar__day--today"          : "",
      isActive        ? "calendar__day--active"         : "",
      hasTransaction  ? "calendar__day--has-transaction": "",
    ]
      .join(" ")
      .replace(/\s{2,}/g, " ");
  
  return (
      <button
        key       = {day.toISOString()}
        onClick   = {() => dispatch(setActiveDate(day.toISOString()))}
        className = {className}
      >
        <div>
          {day.getDate()}
          {hasTransaction && <div className="calendar__day__marker"></div>}
        </div>
      </button>
    );
  }
);

export default CalendarDay;

import { useDispatch, useSelector }   from "react-redux";
import React                          from "react";

import { interpolateRgb }             from 'd3-interpolate';
import { RGBColor, rgb as d3Rgb }     from 'd3-color';

import { aggregateBalanceOnDate }     from './../redux/slices/projections';
import { setActiveDate }              from "./../redux/slices/activedates";
import { RootState }                  from "./../redux/store";

import "./../css/Calendar.css";

interface CalendarDayProps {
  day           : Date;
  isCurrentMonth: boolean;
  isToday       : boolean;
  isActive      : boolean;
  hasTransaction: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = React.memo(
  ({ day, isCurrentMonth, isToday, isActive, hasTransaction }) => {
    const dispatch  = useDispatch();
    const state = useSelector((state: RootState) => state);

    function calculateRelativeBalance(
      healthRangeBottom: number,
      healthRangeTop: number,
      todaysBalance: number
    ): number {
      if (healthRangeTop - healthRangeBottom === 0) {
        return 0;
      }

      const relativeBalance =
        (todaysBalance - healthRangeBottom) / (healthRangeTop - healthRangeBottom);
    
      return relativeBalance;
    }
    
    const todaysBalance: number = aggregateBalanceOnDate(state, day.toISOString().slice(0, 10));
    let dayHealth: number = calculateRelativeBalance(state.userPrefs.healthRangeBottom, state.userPrefs.healthRangeTop,todaysBalance); 
    
    // TODO: Put this in the right place. Either color pallette data or user prefs. 
    let colors = ['#43a04719', '#43a04775', '#43a04775', '#43a04775', '#43a047'];
    
    // TODO: Make this a utility. 
    function hexToRGB(hex: string): RGBColor {
      return d3Rgb(hex);
    }
    
    function lerpColor(a: RGBColor, b: RGBColor, amount: number): string {
      return interpolateRgb(a, b)(amount).toString();
    }
    
    function getColorFromGradient(colors: string[], amount: number): string {
      // Clamp amount between 0 and 1
      amount = Math.max(0, Math.min(1, amount));
    
      let space = 1 / (colors.length - 1);
      let index = Math.floor(amount / space);
    
      let colorA = hexToRGB(colors[index]);
      let colorB = hexToRGB(colors[index + 1]);
    
      let t = (amount - space * index) / space;
      return lerpColor(colorA, colorB, t);
    }

    const className = [
      "glassjar__calendar__day",
      !isCurrentMonth ? "other-month"     : "",
      isToday         ? "today"           : "",
      isActive        ? "active"          : "",
      hasTransaction  ? "has-transaction" : "",
    ]
      .join(" ")
      .replace(/\s{2,}/g, " ");

    return (
      <div className={className} style={{ backgroundColor: getColorFromGradient(colors, dayHealth) }}>
        <h1 key={day.toISOString()}
          onClick={() => dispatch(setActiveDate(day.toISOString()))} >
          {day.getDate()}
        </h1>
        {hasTransaction && <div className="glassjar__calendar__day-marker"></div>}
      </div>
    );
  }
);

export default CalendarDay;

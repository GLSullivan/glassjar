import { useDispatch, useSelector }   from 'react-redux';
import React                          from 'react';

import { interpolateRgb }             from 'd3-interpolate';
import { RGBColor, rgb as d3Rgb }     from 'd3-color';

import { aggregateBalanceOnDate }     from './../redux/slices/projections';
import { setActiveDate }              from './../redux/slices/activedates';
import { RootState }                  from './../redux/store';

import './../css/Calendar.css';

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
    const projections = useSelector((state: RootState) => state.projections);
    const userPrefs = useSelector((state: RootState) => state.userPrefs);

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
    
    const todaysBalance: number = aggregateBalanceOnDate(projections, day.toISOString().slice(0, 10));
    
    let dayHealth: number = calculateRelativeBalance(userPrefs.healthRangeBottom, userPrefs.healthRangeTop,todaysBalance); 
    
    // TODO: Put this in the right place. Either color pallette data or user prefs. 
    let colors = ['#e53935', '#d1d1d1', '#43a047'];
    
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
      'glassjar__calendar__day',
      !isCurrentMonth ? 'other-month'     : '',
      isToday         ? 'today'           : '',
      isActive        ? 'active'          : '',
      hasTransaction  ? 'has-transaction' : '',
    ]
      .join(' ')
      .replace(/\s{2,}/g, ' ');

    return (
      <button className={className} onClick={() => dispatch(setActiveDate(day.toISOString()))}>
        <h1 key={day.toISOString()} >
          {day.getDate()}
        </h1>
        {hasTransaction && <div className='glassjar__calendar__day-marker' style={{ backgroundColor: getColorFromGradient(colors, dayHealth) }}></div>}
      </button>
    );
  }
);

export default CalendarDay;

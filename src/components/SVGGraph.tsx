import CountUp                                           from 'react-countup';
import { useDispatch, useSelector }                      from 'react-redux';
import {  format,
          isToday,
          addMonths,
          startOfMonth,
          endOfMonth }                                   from 'date-fns';
import React, { useEffect, useMemo, useRef, useState }   from 'react';

import { setActiveDate }                                 from './../redux/slices/activedates';
import { accountBalancesByDateRange }                    from './../redux/slices/projections';
import { accountColors }                                 from './../data/AccountColors';
import { Account }                                       from './../models/Account';
import { RootState }                                     from './../redux/store';
import {
  addDaysToKey,
  anyToDateKey,
  daysBetweenKeys,
  fromDateKey,
  toDateKey,
}                                                        from './../utils/dateKey';

import './../css/OutlookGraph.css'

/** Cap on rendered polyline points; longer ranges are sampled down. */
const MAX_GRAPH_POINTS = 400;

interface SVGGraphProps {
  accounts     : Account[];
  thickness   ?: number;
  hideZero    ?: boolean;
  hideTrend   ?: boolean;
  hideDates   ?: boolean;
  hideRange   ?: boolean;
  hideToday   ?: boolean;
  hideStartEnd?: boolean;
  hideMonth   ?: boolean;
}

const SVGGraph: React.FC<SVGGraphProps> = ({
  accounts,
  thickness,
  hideZero,
  hideTrend,
  hideDates,
  hideRange,
  hideToday,
  hideStartEnd,
  hideMonth
}) => {
  const projections    = useSelector((state: RootState) => state.projections);
  const dispatch = useDispatch();

  const graphRange = useSelector((state: RootState) => state.views.graphRange);
  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate);

  const startKey = toDateKey(new Date());
  const endKey   = toDateKey(addMonths(fromDateKey(startKey), graphRange));

  const containerRef                = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setDimensions((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height }
      );
    };

    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Day-indexed series per account, sampled down for rendering on long ranges.
  // All interaction math stays in DAY units; only the polylines are sampled.
  const { accountBalances, sampledDayIndices, colors, yMin, yMax } = useMemo(() => {
    const accountBalances: number[][] = [];
    const colors: string[] = [];
    let yMin = Infinity;
    let yMax = -Infinity;

    for (const account of accounts) {
      colors.push(accountColors[account.color]);
      let balances = accountBalancesByDateRange(projections, account, startKey, endKey);
      if (account.isLiability) {
        balances = balances.map((balance) => -balance);
      }
      accountBalances.push(balances);
      for (const balance of balances) {
        if (balance < yMin) yMin = balance;
        if (balance > yMax) yMax = balance;
      }
    }

    const totalDays = daysBetweenKeys(startKey, endKey) + 1;
    const stride = Math.max(1, Math.ceil(totalDays / MAX_GRAPH_POINTS));
    const sampledDayIndices: number[] = [];
    for (let day = 0; day < totalDays; day += stride) {
      sampledDayIndices.push(day);
    }
    if (sampledDayIndices[sampledDayIndices.length - 1] !== totalDays - 1) {
      sampledDayIndices.push(totalDays - 1);
    }

    return { accountBalances, sampledDayIndices, colors, yMin, yMax };
  }, [projections, accounts, startKey, endKey]);

  const shouldDisplayZeroLine = yMin <= 0 && yMax >= 0;

  const maxDataPoints = Math.max(0, ...accountBalances.map(arr => arr.length));
  const scaleX        = (dayIndex: number) => {
    if (maxDataPoints <= 1) return 0;
    return (dimensions.width / (maxDataPoints - 1)) * dayIndex;
  };

  const margin:number = 4;

  const scaleY = (value: number) => {

    if (yMax === yMin) {
      return 100; 
    }
    const graphHeight = dimensions.height - (2 * margin);
    const scaledY     = graphHeight + margin - ((value - yMin) / (yMax - yMin)) * graphHeight;
    
    if (isNaN(scaledY)) {
      return 100; 
    }
    
    return scaledY;
  };
  
  function roundToNearestPow(value: number): number {
    const digits = Math.ceil(Math.log10(Math.abs(value) + 1));
    const pow    = Math.pow(10, digits > 4 ? digits - 3 : digits);
    return Math.round(value / pow) * pow;
  }
  
  function formatToAttractiveCurrency(num: number): string {
    if (num === 0) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(0);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
  }
  
  const formattedMin = formatToAttractiveCurrency(roundToNearestPow(yMin/100));
  const formattedMax = formatToAttractiveCurrency(roundToNearestPow(yMax/100));

  const formatDateOrToday = (date: Date | null) => {
    return date 
      ? (isToday(date) ? 'Today' : format(date, 'M/d/yy'))
      :     'N/A';  // Fallback if no date is available
  };

  // 3-sample rolling average across all visible accounts (sampled day grid)
  const rollingAverage: { day: number; value: number }[] = useMemo(() => {
    if (hideTrend) return [];
    const points: { day: number; value: number }[] = [];
    for (let s = 0; s < sampledDayIndices.length; s++) {
      let sum   = 0;
      let count = 0;
      for (let j = Math.max(0, s - 2); j <= s; j++) {
        const day = sampledDayIndices[j];
        for (const balances of accountBalances) {
          if (balances[day] !== undefined) {
            sum += balances[day];
            count++;
          }
        }
      }
      points.push({ day: sampledDayIndices[s], value: count > 0 ? sum / count : 0 });
    }
    return points;
  }, [hideTrend, sampledDayIndices, accountBalances]);

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    const touch          = e.touches[0];
    const x              = touch.clientX;
    const svgRect        = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const touchXRelative = x - svgRect.left;

    const dayIndex = Math.round(touchXRelative / (dimensions.width / (maxDataPoints - 1)));
    const date     = fromDateKey(addDaysToKey(startKey, dayIndex));

    dispatch(setActiveDate(date.toISOString()));
  };

  const activeDateIndex = daysBetweenKeys(startKey, anyToDateKey(activeDate));
  const activeDateX     = scaleX(activeDateIndex);

  const firstH4Ref                        = useRef<HTMLHeadingElement>(null);
  const lastH4Ref                         = useRef<HTMLHeadingElement>(null);
  const [firstH4Height, setFirstH4Height] = useState(0);
  const [lastH4Height, setLastH4Height]   = useState(0);
  
  useEffect(() => {
    if (firstH4Ref.current) {
      setFirstH4Height(firstH4Ref.current.offsetHeight);
    }
    if (lastH4Ref.current) {
      setLastH4Height(lastH4Ref.current.offsetHeight);
    }
  }, [firstH4Ref, lastH4Ref]);
  
  const firstBalance = accountBalances[0] ? accountBalances[0][0] : 0;
  const lastBalance  = accountBalances[0] ? accountBalances[0][accountBalances[0].length - 1] : 0;
  let   delta        = lastBalance - firstBalance;

  if (accounts[0] && accounts[0].isLiability) {
    delta *= -1;
  }

  const firstPointY = scaleY(firstBalance);
  const lastPointY  = scaleY(lastBalance);

  const calculateTop = (pointY: number, h4Height: number) => {
    let top = pointY - h4Height / 2;
        top = Math.max(top, 0);
        top = Math.min(top, dimensions.height - h4Height);
    return top;
  };
  
  const firstH4Style: React.CSSProperties = {
    top     : `${calculateTop(firstPointY, firstH4Height)}px`,
    position: 'absolute',
  };
  
  const lastH4Style: React.CSSProperties = {
    top     : `${calculateTop(lastPointY, lastH4Height)}px`,
    position: 'absolute',
  };
  
    // New state to hold the box dimensions and position
  const [boxStyle, setBoxStyle]   = useState<React.CSSProperties>({});
  const [lineStyle, setLineStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (activeDate) {
      const activeKey = anyToDateKey(activeDate);

      // Calendar-day math (DST-safe) for the active-month highlight box.
      const monthStartKey = toDateKey(startOfMonth(fromDateKey(activeKey)));
      const monthEndKey   = toDateKey(endOfMonth(fromDateKey(activeKey)));

      const totalDays       = daysBetweenKeys(startKey, endKey);
      const activeStartDays = daysBetweenKeys(startKey, monthStartKey);
      const monthDays       = daysBetweenKeys(monthStartKey, monthEndKey) + 1;

      const dayWidth = totalDays > 0 ? dimensions.width / totalDays : 0;

      setBoxStyle({
        position: 'absolute',
        left    : `${dayWidth * activeStartDays}px`,
        width   : `${dayWidth * monthDays}px`,
        bottom  : '0',
      });

      setLineStyle({
        left    : `${activeDateX}px`,
      });
    }
      // eslint-disable-next-line
    }, [activeDate, dimensions, graphRange ]);

  return (
    <div className = 'glassjar__svg-graph'>

      {(activeDate && !hideToday) && (
        <div
        className='glassjar__svg-graph__day-box'
        style={lineStyle}
        />
      )}

      {!hideMonth && <div className='glassjar__svg-graph__month-box' style={boxStyle} ><div/><div/></div>}

      <div className = 'glassjar__svg-graph__graph-holder' ref = {containerRef}>

      <svg 
      width        = {Math.ceil(dimensions.width)}
      height       = {Math.ceil(dimensions.height)}
      onTouchStart = {handleTouchStart}
      >

        {!hideTrend &&
          <polyline
            points={rollingAverage
              .map((point) => `${scaleX(point.day)},${scaleY(point.value)}`)
              .join(' ')}
            stroke      = '#e2e3e4'
            strokeWidth = '10'
            fill        = 'none'
            opacity     = '0.5'
          />
        }

        {accountBalances.map((balances, index) => (
          <polyline
            key    = {index}
            points = {sampledDayIndices
              .map((day) => `${scaleX(day)},${scaleY(balances[day] ?? 0)}`)
              .join(' ')}
            stroke      = {colors[index]}
            strokeWidth = {thickness ? thickness.toString() : '2'}
            fill        = 'none'
          />
        ))}

        {(shouldDisplayZeroLine && !hideZero) && (
          <line
            x1              = '0'
            y1              = {scaleY(0)}
            x2              = {dimensions.width}
            y2              = {scaleY(0)}
            stroke          = '#202230'
            strokeWidth     = '2'
            strokeDasharray = '10,10'
          />
        )}
      </svg>

      {!hideStartEnd &&
        <>
          <div className = 'glassjar__svg-graph__data'  style = {firstH4Style} ref = {firstH4Ref}>
          <h5  className = 'glassjar__fill-back'>{formatDateOrToday(fromDateKey(startKey))}</h5>
          <h4  className = 'glassjar__mono-spaced glassjar__fill-back'>
              <em> 
                <CountUp
                  decimals      = {2}
                  decimal       = '.'
                  prefix        = '$'
                  end           = {firstBalance / 100}
                  duration      = {2}
                  preserveValue = {true}
                />
              </em>
            </h4>
          </div>
          <div className = 'glassjar__svg-graph__data glassjar__svg-graph__data--end' style = {lastH4Style} ref = {lastH4Ref}>
          <h5  className = 'glassjar__fill-back'>{formatDateOrToday(fromDateKey(endKey))}</h5>
          <h4  className = 'glassjar__mono-spaced glassjar__fill-back'>
              <em> 
                <CountUp
                  decimals      = {2}
                  decimal       = '.'
                  prefix        = '$'
                  end           = {lastBalance / 100}
                  duration      = {2}
                  preserveValue = {true}
                />
              </em>
            </h4>
            <h5 className = 'glassjar__mono-spaced glassjar__fill-back'>
              {delta < 0 ? <i className='fa-duotone fa-caret-down' /> : <i className='fa-duotone fa-caret-up' />}{' '}
                <CountUp
                  decimals      = {2}
                  decimal       = '.'
                  prefix        = '$'
                  end           = {Math.abs(delta / 100)}
                  duration      = {2}
                  preserveValue = {true}
                />
            </h5>
          </div>
        </>
      }
</div>
      
      {!hideRange &&
        <>
          <div className = 'glassjar__graph-range glassjar__graph-range-max'>{formattedMax}</div>
          <div className = 'glassjar__graph-range glassjar__graph-range-min'>{formattedMin}</div>
        </>
      }

      {!hideDates &&
        <>
          <h2>{formatDateOrToday(fromDateKey(startKey))}</h2>
          <h2>{formatDateOrToday(fromDateKey(endKey))}</h2>
        </>
      }
    </div>
    
  );
};

export default SVGGraph;

import CountUp                                           from 'react-countup';
import { useDispatch, useSelector }                      from 'react-redux';
import {  format,
          isToday, 
          startOfDay, 
          addMonths, 
          startOfMonth, 
          endOfMonth }                                   from 'date-fns';
import React, { useEffect, useRef, useState }            from 'react';

import { setActiveDate }                                 from './../redux/slices/activedates';
import { accountBalancesByDateRange }                    from './../redux/slices/projections';
import { accountColors }                                 from './../data/AccountColors';
import { Account }                                       from './../models/Account';
import { RootState }                                     from './../redux/store';

import './../css/OutlookGraph.css'

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

  let yMin: number     = Infinity;   // Initialize to Infinity
  let yMax: number     = -Infinity;  // Initialize to -Infinity
  let colors: string[] = [];

  let startDate = startOfDay(new Date()).toISOString();
  let endDate   = addMonths(startOfDay(new Date()),graphRange).toISOString();

  const containerRef                = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateDimensions = () => {
    if (containerRef.current) {
      const { width, height } = (
        containerRef.current as HTMLElement
      ).getBoundingClientRect();
      setDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateDimensions();  // Initial dimensions
    window.addEventListener('resize', updateDimensions);

    if (containerRef.current) {
      const { width, height } = (
        containerRef.current as HTMLElement
      ).getBoundingClientRect();
      setDimensions({ width, height });
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef, projections]);

  const accountBalances: number[][] = [];

  for (const account of accounts) {
    colors.push(accountColors[account.color]);
    let balances = accountBalancesByDateRange(
      projections,
      account,
      startDate,
      endDate
    ) as number[];
    if (account.isLiability) {
      balances = balances.map((balance) => -balance);
    }

    accountBalances.push(balances);

      // Update yMin and yMax
    const minBalance               = Math.min(...balances);
    const maxBalance               = Math.max(...balances);
    if    (minBalance < yMin) yMin = minBalance;
    if    (maxBalance > yMax) yMax = maxBalance;
  }

  const shouldDisplayZeroLine = yMin <= 0 && yMax >= 0;

  const maxDataPoints = Math.max(...accountBalances.map(arr => arr.length));
  const scaleX        = (index: number) => {
    return (dimensions.width / (maxDataPoints - 1)) * index;
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

  // Calculate 3-day rolling average
  const rollingAverage: number[] = [];
  if (!hideTrend) {

    for (let i = 0; i < maxDataPoints; i++) {
      let sum   = 0;
      let count = 0;
      for (let j = Math.max(0, i - 2); j <= i; j++) {
        for (const balances of accountBalances) {
          if (balances[j] !== undefined) {
            sum += balances[j];
            count++;
          }
        }
      }
      rollingAverage.push(count > 0 ? sum / count : 0);
    }
  }

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    const touch          = e.touches[0];
    const x              = touch.clientX;
    const svgRect        = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const touchXRelative = x - svgRect.left;

    const index = Math.round(touchXRelative / (dimensions.width / (maxDataPoints - 1)));

    const date = new Date(new Date(startDate).getTime() + index * 24 * 60 * 60 * 1000);

    dispatch(setActiveDate(date.toISOString()));  
  };

  const activeDateIndex = (new Date(activeDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000);
  const activeDateX     = scaleX(Math.round(activeDateIndex));

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
      const activeDateObj = startOfDay(new Date(activeDate));
      const startDateObj  = startOfDay(new Date(startDate));
      const endDateObj    = startOfDay(new Date(endDate));
  
      // Use date-fns to get the start and end dates of the active month
      const activeMonthStart = startOfMonth(activeDateObj);
      const activeMonthEnd   = endOfMonth(activeDateObj);
  
      // Calculate the position of the active month relative to the start and end dates
      const totalDays       = (endDateObj.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000);
      const activeStartDays = (activeMonthStart.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000);
  
      // Calculate the width of one day in the SVG
      const dayWidth = dimensions.width / totalDays;
  
      // Calculate the x-position and width of the box
      const boxX     = dayWidth * activeStartDays;
      const boxWidth = dayWidth * ((activeMonthEnd.getTime() - activeMonthStart.getTime()) / (24 * 60 * 60 * 1000) + 1);
  
      // Update the boxStyle state
      setBoxStyle({
        position: 'absolute',
        left    : `${boxX}px`,
        width   : `${boxWidth}px`,
        bottom  : '0',
      });

      // Update the boxStyle state
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
              .map((avg, i) => `${scaleX(i)},${scaleY(avg)}`)
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
            points = {balances
              .map((balance, i) => `${scaleX(i)},${scaleY(balance)}`)
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
          <h5  className = 'glassjar__fill-back'>{formatDateOrToday(new Date(startDate))}</h5>
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
          <h5  className = 'glassjar__fill-back'>{formatDateOrToday(new Date(endDate))}</h5>
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
          <h2>{formatDateOrToday(new Date(startDate))}</h2>
          <h2>{formatDateOrToday(new Date(endDate))}</h2>
        </>
      }
    </div>
    
  );
};

export default SVGGraph;

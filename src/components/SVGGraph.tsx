import CountUp                                from 'react-countup';
import { useDispatch, useSelector }           from 'react-redux';
import { format, isToday }                    from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';

import { setActiveDate }                      from './../redux/slices/activedates';
import { accountBalancesByDateRange }         from './../redux/slices/projections';
import { accountColors }                      from './../data/AccountColors';
import { Account }                            from './../models/Account';
import { RootState }                          from './../redux/store';

interface SVGGraphProps {
  startDate    : string;
  endDate      : string;
  accounts     : Account[];
  thickness   ?: number;
  hideZero    ?: Boolean;
  hideTrend   ?: Boolean;
  hideDates   ?: Boolean;
  hideRange   ?: Boolean;
  hideToday   ?: Boolean;
  hideStartEnd?: Boolean;
}

const SVGGraph: React.FC<SVGGraphProps> = ({
  startDate,
  endDate,
  accounts,
  thickness,
  hideZero,
  hideTrend,
  hideDates,
  hideRange,
  hideToday,
  hideStartEnd
}) => {
  const state    = useSelector((state: RootState) => state);
  const dispatch = useDispatch();                            

  let yMin: number = Infinity;  // Initialize to Infinity
  let yMax: number = -Infinity; // Initialize to -Infinity
  let colors: string[] = [];

  const containerRef                = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const activeDate = useSelector((state: RootState) => state.activeDates.activeDate); 

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
  }, [containerRef]);

  const accountBalances: number[][] = [];

  for (const account of accounts) {
    colors.push(accountColors[account.color]);
    let balances = accountBalancesByDateRange(
      state,
      account.id,
      startDate,
      endDate
    ) as number[];

        // Invert balances if the account is a liability
    if (account.isLiability) {
      balances = balances.map((balance) => -balance);
    }

    accountBalances.push(balances);

    // Update yMin and yMax
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    if (minBalance < yMin) yMin = minBalance;
    if (maxBalance > yMax) yMax = maxBalance;
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
    const scaledY = graphHeight + margin - ((value - yMin) / (yMax - yMin)) * graphHeight;
    
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
      :    'N/A';  // Fallback if no date is available
  };

    // Calculate 3-day rolling average
  const rollingAverage: number[] = [];
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

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const svgRect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const touchXRelative = x - svgRect.left;

    const index = Math.round(touchXRelative / (dimensions.width / (maxDataPoints - 1)));

    const date = new Date(new Date(startDate).getTime() + index * 24 * 60 * 60 * 1000);

    dispatch(setActiveDate(date.toISOString()));  
  };

  const activeDateIndex = (new Date(activeDate).getTime() - new Date(startDate).getTime()) / (24 * 60 * 60 * 1000);
  const activeDateX     = scaleX(Math.round(activeDateIndex));

  const firstH4Ref = useRef<HTMLHeadingElement>(null);
  const lastH4Ref = useRef<HTMLHeadingElement>(null);
  const [firstH4Height, setFirstH4Height] = useState(0);
  const [lastH4Height, setLastH4Height] = useState(0);
  
  useEffect(() => {
    if (firstH4Ref.current) {
      setFirstH4Height(firstH4Ref.current.offsetHeight);
    }
    if (lastH4Ref.current) {
      setLastH4Height(lastH4Ref.current.offsetHeight);
    }
  }, [firstH4Ref, lastH4Ref]);
  
  const firstBalance    = accountBalances[0] ? accountBalances[0][0] : 0;
  const lastBalance     = accountBalances[0] ? accountBalances[0][accountBalances[0].length - 1] : 0;
  let   delta           = lastBalance - firstBalance;

  if (accounts[0] && accounts[0].isLiability) {
    delta *= -1;
  }

  const firstPointY = scaleY(firstBalance);
  const lastPointY = scaleY(lastBalance);

  const calculateTop = (pointY: number, h4Height: number) => {
    let top = pointY - h4Height / 2;
    top = Math.max(top, 0);
    top = Math.min(top, dimensions.height - h4Height);
    return top;
  };
  
  const firstH4Style: React.CSSProperties = {
    top: `${calculateTop(firstPointY, firstH4Height)}px`,
    position: 'absolute',
  };
  
  const lastH4Style: React.CSSProperties = {
    top: `${calculateTop(lastPointY, lastH4Height)}px`,
    position: 'absolute',
  };
  


    return (
    <div className = 'glassjar__svg-graph' ref            = {containerRef}>
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
            strokeWidth={thickness ? thickness.toString() : '1'}
            fill        = 'none'
          />
        ))}

        {(shouldDisplayZeroLine && !hideZero) && (
          <line
            x1              = '0'
            y1              = {scaleY(0)}
            x2              = {dimensions.width}
            y2              = {scaleY(0)}
            stroke          = '#8f8f8f'
            strokeWidth     = '1'
            strokeDasharray = '10,10'
          />
        )}
        
        {(activeDate && !hideToday) && (
          <line
            x1={activeDateX}
            y1={0}
            x2={activeDateX}
            y2={dimensions.height}
            stroke="#8f8f8f"  
            strokeWidth="5"
            opacity     = '0.25'
          />
        )}

      </svg>
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

      {!hideStartEnd &&
        <>
          <div className='glassjar__SVGGraph__data'  style={firstH4Style} ref={firstH4Ref}>          
            <h5 className='glassjar__fill-back'>{formatDateOrToday(new Date(startDate))}</h5>
            <h4 className="glassjar__mono-spaced glassjar__fill-back">
              <em> 
                <CountUp
                  decimals={2}
                  decimal="."
                  prefix="$"
                  end={firstBalance / 100}
                  duration={2}
                  preserveValue={true}
                />
              </em>
            </h4>
          </div>
          <div className='glassjar__SVGGraph__data glassjar__SVGGraph__data--end' style={lastH4Style} ref={lastH4Ref}>
            <h5 className='glassjar__fill-back'>{formatDateOrToday(new Date(endDate))}</h5>
            <h4 className="glassjar__mono-spaced glassjar__fill-back">
              <em> 
                <CountUp
                  decimals={2}
                  decimal="."
                  prefix="$"
                  end={lastBalance / 100}
                  duration={2}
                  preserveValue={true}
                />
              </em>
            </h4>
            <h5 className="glassjar__mono-spaced glassjar__fill-back">
              {delta < 0 ? <i className="fa-duotone fa-caret-down" /> : <i className="fa-duotone fa-caret-up" />}{' '}
                <CountUp
                  decimals={2}
                  decimal="."
                  prefix="$"
                  end={Math.abs(delta / 100)}
                  duration={2}
                  preserveValue={true}
                />
            </h5>
          </div>
        </>
      }
    </div>
    
  );
};

export default SVGGraph;

import React, { useEffect, useRef, useState } from 'react';
import { useSelector }                        from 'react-redux';
import { RootState }                          from '../redux/store';
import { Account }                            from '../models/Account';
import { accountBalancesByDateRange }         from './../redux/slices/projections';
import { accountColors }                      from '../data/AccountColors';
import SpanChangeButton                       from './../components/SpanChangeButton';
import { format, isToday }                    from 'date-fns';

interface SVGGraphProps {
  startDate : string;
  endDate   : string;
  accounts  : Account[];
  hideSpan ?: Boolean;
  hideZero ?: Boolean;
  hideTrend?: Boolean;
  hideDates?: Boolean;
  hideRange?: Boolean;
  thickness?: number;
}

const SVGGraph: React.FC<SVGGraphProps> = ({
  startDate,
  endDate,
  accounts,
  hideSpan,
  hideZero,
  hideTrend,
  hideDates,
  hideRange,
  thickness
}) => {
  const state = useSelector((state: RootState) => state);

  let yMin: number     = 0;
  let yMax: number     = 0;
  let colors: string[] = [];

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

  const scaleY = (value: number) => {
    const graphHeight = dimensions.height;
    return graphHeight - ((value - yMin) / (yMax - yMin)) * graphHeight;
  };

  function roundToNearestPow(value: number): number {
    const digits = Math.ceil(Math.log10(Math.abs(value) + 1));
    const pow    = Math.pow(10, digits > 4 ? digits - 3 : digits);
    return Math.round(value / pow) * pow;
  }
  
  function formatToAttractiveCurrency(num: number): string {
    if (num === 0) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(0);
  
    const rounded = roundToNearestPow(Math.abs(num));
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num < 0 ? -rounded : rounded);
  }
  
  const formattedMin = formatToAttractiveCurrency(yMin/100);
  const formattedMax = formatToAttractiveCurrency(yMax/100);

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

  return (
    <div className = 'glassjar__svg-graph' ref            = {containerRef}>
      <svg width     = {Math.ceil(dimensions.width)} height = {Math.ceil(dimensions.height)}>
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

      {!hideSpan &&
        <div className = 'glassjar__graph-holder__range-change'>
          <SpanChangeButton />
        </div>
      }
    </div>
  );
};

export default SVGGraph;

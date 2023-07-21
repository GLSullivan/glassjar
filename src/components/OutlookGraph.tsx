import React, { 
  useState, 
  useEffect }                                 from 'react';

import { 
  startOfMonth,
  addDays,
  formatISO,
  format, 
  endOfMonth, 
  addMonths, 
  isAfter,
  isToday}                                    from 'date-fns';

import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Label,
  ResponsiveContainer,
  ReferenceLine,
}                                             from 'recharts';

import { useDispatch, useSelector }                        from 'react-redux';

import { accountBalancesByDateRange }         from './../redux/slices/projections';
import { Account }                            from './../models/Account';
import { RootState }                          from './../redux/store';
import { colorPalette }                       from '../data/ColorPalette';

import './../css/OutlookGraph.css';
import { setGraphRange } from '../redux/slices/views';

const OutlookGraph: React.FC = () => {
  const dispatch = useDispatch()
  const graphRange = useSelector((state: RootState) => state.views.graphRange);

  const rangeChoices: number[]            = [1,3,6,12];
  const state                             = useSelector((state: RootState) => state);
  const accounts                          = useSelector((state: RootState) => state.accounts.accounts);
  const activeDate                        = useSelector((state: RootState) => state.activeDates.activeDate);
  const today                             = useSelector((state: RootState) => state.activeDates.today);
  const [accountColors, setAccountColors] = useState<Record<string, string>>({});
  const [combinedData, setCombinedData]   = useState<CombinedData[]>([]);
  const [xTicks, setXTicks]               = useState<string[]>([]);
  const [yTicks, setYTicks]               = useState<number[]>([]);
  const [minY, setMinY]                   = useState<number>(0);
  const [maxY, setMaxY]                   = useState<number>(0);
  const [dataKeys, setDataKeys]           = useState<string[]>([]);

  type CombinedData = {
    date: string;
    [key: string]: number | string;
  };

  const currencyFormatter = (item: any) => {
    return Number(item).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }

  useEffect(() => {
    function firstOrToday(inputDate: string) {
      const todayDate = new Date(today); // gets today's date
      const firstDayOfMonth = startOfMonth(new Date(inputDate)); // gets the first day of the month of inputDate
  
      if (isAfter(firstDayOfMonth, todayDate) || isToday(firstDayOfMonth)) {
        // If the first day of the inputDate month is later than today, or it is today
        return formatISO(firstDayOfMonth);
      } else {
        // If today's date is later
        return formatISO(todayDate);
      }
    }

    const graphStart = firstOrToday(activeDate);
    const graphEnd   = formatISO(endOfMonth(addMonths(new Date(graphStart), graphRange || 6)));

    const colors: Record<string, string> = {};

    const accountBalances: number[][] = [];
    const graphingAccounts: Account[] = [];

    for (const account of accounts) {
      if (account.showInGraph) {
        const balances = accountBalancesByDateRange(
          state,
          account.id,
          graphStart,
          graphEnd
        ) as number[];
        accountBalances.push(balances);
        graphingAccounts.push(account)
        colors[account.name] = colorPalette[account.color];
      }
    }

    setAccountColors(colors);

    const tempCombinedData: CombinedData[] = [];
    let minY = Infinity;
    let maxY = -Infinity;

    if (accountBalances[0] && Array.isArray(accountBalances[0])) {
      for (let dayIndex = 0; dayIndex < accountBalances[0].length; dayIndex++) {
        const date = addDays(new Date(graphStart), dayIndex);
        const dayData: CombinedData = {
          date: format(date, 'M/d/yy')
        };

        for (
          let accountIndex = 0;
          accountIndex < graphingAccounts.length;
          accountIndex++
        ) {
          let multiplier = 1;
          if (graphingAccounts[accountIndex].isLiability) {
            multiplier = -1;
          }
          const balance = (
            (accountBalances[accountIndex][dayIndex] * multiplier) /
            100
          ).toFixed(2);
          dayData[graphingAccounts[accountIndex].name] = balance;

          minY = Math.min(minY, Number(balance));
          maxY = Math.max(maxY, Number(balance));
        }
        tempCombinedData.push(dayData);
      }

      setMinY(minY - Math.abs(minY) * 0.1); // Force a wee margin
      setMaxY(maxY + Math.abs(maxY) * 0.1);

      let new_yTicks = [minY];
      if (minY < 0 && maxY > 0) {
        new_yTicks.push(0);
      }
      new_yTicks.push(maxY);

      setYTicks(new_yTicks);

      setXTicks([
        format(new Date(tempCombinedData[0].date), 'M/d/yy'),
        format(new Date(tempCombinedData[tempCombinedData.length - 1].date), 'M/d/yy')
      ]);

      if (tempCombinedData.length > 0) {
        const keys = Object.keys(tempCombinedData[0]).filter(key => key !== 'date');
        setDataKeys(keys);
      } else {
        setDataKeys([]);
      }

      setCombinedData(tempCombinedData)
    }

  }, [
    activeDate,
    accounts,
    state,
    graphRange,
    today
  ])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='glassjar__custom-tooltip'>
          <h3 className='label'>{`${label}`}</h3>
          <table>
            <tbody>
              {payload.map(
                (entry: { color: any; name: any; value: any }, index: any) => (
                  <tr key={index}>
                    <td key={`item-${index}`} style={{ color: entry.color }}>
                      {`${entry.name}:`}
                    </td>
                    <td>{currencyFormatter(entry.value)}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  function CustomXAxisTick({ x, y, payload }: any, data: string | any[]) {
    const isFirstOrLast = payload.value === data[0].date || payload.value === data[data.length - 1].date;

    return (
      <text 
        x          = {x}
        y          = {y + 10}
        fill       = '#666'
        textAnchor = {isFirstOrLast ? (payload.value === data[0].date ? 'start' : 'end') : 'middle'}
      >
        {payload.value}
      </text>
    );
  }

  const handleSpanChange = () => {
    let currentIndex = rangeChoices.findIndex(value => value === graphRange);
    let nextIndex    = (currentIndex + 1) % rangeChoices.length;
    dispatch(setGraphRange(rangeChoices[nextIndex]))
  };

  if (accounts.length === 0) {
    return (
      <div>No accounts available. Please add an account to see the graph.</div>
    );
  }

  return (
    <div className='glassjar__graph-holder'>
      <h2>Balance Outlook</h2>
      <div className='glassjar__graph-holder__sub'>
        <div className='glassjar__graph-holder__sub-sub'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={combinedData}>
              {/* <CartesianGrid strokeDasharray='3 3' /> */}
              <XAxis 
                dataKey = 'date'
                tick    = {(props) => CustomXAxisTick(props, combinedData)}
                ticks   = {xTicks} />
              <YAxis
                ticks         = {yTicks}
                tickFormatter = {currencyFormatter}
                width         = {75}
                domain        = {[minY, maxY]}
                tickCount     = {5}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                position = 'start'
                x        = {format(new Date(state.activeDates.activeDate), 'M/d/yy')}
                stroke   = '#54816F'
              >
                <Label position={'right'}>
                  {format(new Date(state.activeDates.activeDate), 'M/d')}
                </Label>
              </ReferenceLine>
              {dataKeys.map((key, index) => (
                <Line
                  key               = {key}
                  type              = 'monotone'
                  dataKey           = {key}
                  stroke            = {accountColors[key]}
                  strokeWidth       = {2}
                  activeDot         = {{ r: 8 }}
                  dot               = {false}
                  isAnimationActive = {false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className='glassjar__graph-holder__range-change'>
        <button className='glassjar__button glassjar__button--small' onClick={() => handleSpanChange()}>{graphRange}</button>
      </div>
    </div>
  );
};

export default OutlookGraph;

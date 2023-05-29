import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef}                               from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
  ResponsiveContainer,
  ReferenceLine,
}                                             from "recharts";
import { useDispatch, useSelector }           from "react-redux";

import { accountBalancesByDateRange }         from "./../redux/slices/projections";
import { setGraphSpan }                       from "./../redux/slices/activedates";
import { Account }                            from "./../models/Account";
import { RootState }                          from "./../redux/store";
import { colorPalette }                       from "../data/ColorPalette";
import { setFarDate, setNearDate }            from '../redux/slices/activedates';

import "./../css/OutlookGraph.css";

const OutlookGraph: React.FC = () => {
  const state                             = useSelector((state: RootState) => state);
  const dispatch                          = useDispatch();
  const [currentMonth, setCurrentMonth]   = useState(new Date());
  const farDate                           = useSelector((state: RootState) => state.activeDates.farDate);
  const [accountColors, setAccountColors] = useState<Record<string, string>>({});

  const [minY, setMinY] = useState<number>(0);
  const [maxY, setMaxY] = useState<number>(0);

  type CombinedData = {
    date: string;
    [key: string]: number | string;
  };

  const formatDate = (date: Date): string => {
    const month = date.toLocaleString("en-us", { month: "numeric" });
    const day = date.getDate();
    return ` ${month}/${day} `;
  };

  const accounts = state.accounts.accounts;

  const [combinedData, setCombinedData] = useState<CombinedData[]>([]);

  const currencyFormatter = (item: any) =>
    item.toLocaleString("en-US", {
      style                : "currency",
      currency             : "USD",
      maximumFractionDigits: 0,
    });
    const xTicks = useRef<(string | number)[]>([]);

  const combineAccountBalances = useCallback((
    accounts: Account[],
    accountBalances: number[][]
  ): { combinedData: CombinedData[]; minY: number; maxY: number } => {
    const combinedData: CombinedData[] = [];
    let minY = Infinity;
    let maxY = -Infinity;
    const today = new Date(Date.parse(state.activeDates.graphNearDate));

    for (let dayIndex = 0; dayIndex < accountBalances[0].length; dayIndex++) {
      const date = new Date(today.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      const dayData: CombinedData = {
        date: formatDate(date),
      };

      for (
        let accountIndex = 0;
        accountIndex < accounts.length;
        accountIndex++
      ) {
        if (accounts[accountIndex].showInGraph) {
          let multiplier = 1;
          if (accounts[accountIndex].isLiability) {
            multiplier = -1;
          }
          const balance = (
            accountBalances[accountIndex][dayIndex] * multiplier / 100
          ).toFixed(2);
          dayData[accounts[accountIndex].name] = balance;

          minY = Math.min(minY, Number(balance));
          maxY = Math.max(maxY, Number(balance));
        }
      }

      combinedData.push(dayData);
    }

    minY = minY - Math.abs(minY) * 0.1;
    maxY = maxY + Math.abs(maxY) * 0.1;
    xTicks.current = [combinedData[0].date, combinedData[combinedData.length - 1].date];
    return { combinedData, minY, maxY };
  }, [state.activeDates.graphNearDate]);

  useEffect(() => {
    const accountBalances: number[][] = accounts.map(
      (account) =>
        accountBalancesByDateRange(
          state,
          account.id,
          state.activeDates.graphNearDate,
          state.activeDates.graphFarDate
        ) as number[]
    );

    const {
      combinedData: newCombinedData,
      minY,
      maxY,
    } = combineAccountBalances(accounts, accountBalances);

    const colors: Record<string, string> = {};
    for (let account of accounts) {
      if (account.showInGraph) {
        colors[account.name] = colorPalette[account.color];
      }
    }
    setAccountColors(colors);


    setCombinedData(newCombinedData);
    setMinY(minY);
    setMaxY(maxY);
  }, [
    state.activeDates.graphNearDate,
    state.activeDates.graphFarDate,
    accounts,
    combineAccountBalances,
    state,
  ]);

  if (accounts.length === 0) {
    return (
      <div>No accounts available. Please add an account to see the graph.</div>
    );
  }

  // Function to change the month based on the given direction
  const changeMonth = (direction: 'next' | 'previous') => {
    let newMonth;
    setTimeout(() => {
      if (direction === 'next') {
        newMonth = new Date(
          currentMonth.setMonth(currentMonth.getMonth() + 1)
        );
        const farDateMinusTwoMonths = new Date(
          new Date(farDate).setMonth(new Date(farDate).getMonth() - 2)
        );

        if (newMonth > farDateMinusTwoMonths) {
          const futureMonth = new Date(newMonth);
          futureMonth.setMonth(futureMonth.getMonth() + 2);
          dispatch(setFarDate(futureMonth.toISOString()));
        }
        setCurrentMonth(new Date(newMonth));
        dispatch(setNearDate(new Date(newMonth).toISOString()));
      } else {
        newMonth = new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
        setCurrentMonth(new Date(newMonth));
        dispatch(setNearDate(new Date(newMonth).toISOString()));

      }
    }, 0);
  };

  const renderChart = (
    combinedData: CombinedData[],
    dataKeys    : string[],
    minY        : number,
    maxY        : number,
    colors      : Record<string,  string>
  ) => {

    let yTicks = [minY];
    if (minY < 0 && maxY > 0) {
      yTicks.push(0);
    }
    yTicks.push(maxY);

    return (
      <div className="glassjar__graph-holder">
        <div className='glassjar__calendar__navigation'>
          <button onClick={() => changeMonth('previous')}>
            <i className='fa-regular fa-chevron-left' />
          </button>
          <h2
            className='glassjar__calendar__month'
            onClick={() => { setCurrentMonth(new Date()); dispatch(setNearDate(new Date(new Date()).toISOString())) }}
          >
            {currentMonth.toLocaleString('default', { month: 'long' })}{' '}
            {currentMonth.getFullYear()}
          </h2>
          <button onClick={() => changeMonth('next')}>
            <i className='fa-regular fa-chevron-right' />
          </button>
        </div>
        <div className="glassjar__graph-holder__sub">
          <div className="glassjar__graph-holder__sub-sub">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" ticks={xTicks.current} />
                <YAxis
                  ticks={yTicks}
                  tickFormatter={currencyFormatter}
                  width={75}
                  domain={[minY, maxY]}
                  tickCount={5}
                />
                <Tooltip />
                <ReferenceLine
                  position="start"
                  x={formatDate(new Date(state.activeDates.activeDate))}
                  stroke="#54816F"
                >
                  <Label position={"right"}>
                    {formatDate(new Date(state.activeDates.activeDate))}
                  </Label>
                </ReferenceLine>
                {dataKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[key]}
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glassjar__flex glassjar__flex--justify-between">
          <button onClick={() => dispatch(setGraphSpan(3))}>3</button>
          <button onClick={() => dispatch(setGraphSpan(6))}>6</button>
          <button onClick={() => dispatch(setGraphSpan(12))}>12</button>
        </div>
      </div>
    );
  };

  const dataKeys = Object.keys(combinedData[0] || {}).filter(
    (key) => key !== "date"
  );

  return renderChart(combinedData, dataKeys, minY, maxY, accountColors);
};

export default OutlookGraph;

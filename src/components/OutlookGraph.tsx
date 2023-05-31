import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef }                                    from "react";

import { startOfMonth,
  addDays,
  formatISO,
  format, 
  endOfMonth, 
  addMonths, 
  isBefore, 
  isSameMonth,
  isAfter,
  isToday}                               from 'date-fns';

import { LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
  ResponsiveContainer,
  ReferenceLine,
}                                             from "recharts";

import { useSelector }                        from "react-redux";

import { accountBalancesByDateRange }         from "./../redux/slices/projections";
import { Account }                            from "./../models/Account";
import { RootState }                          from "./../redux/store";
import { colorPalette }                       from "../data/ColorPalette";

import "./../css/OutlookGraph.css";

const OutlookGraph: React.FC = () => {
  const [graphSpan, setGraphSpan]         = useState(6);
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
    return Number(item).toLocaleString("en-US", {
      style                : "currency",
      currency             : "USD",
      maximumFractionDigits: 0,
    });
  }

  function firstOrToday(inputDate: string) {
    const today = new Date(); // gets today's date
    const firstDayOfMonth = startOfMonth(new Date(inputDate)); // gets the first day of the month of inputDate
  
    if (isAfter(firstDayOfMonth, today) || isToday(firstDayOfMonth)) {
      // If the first day of the inputDate month is later than today, or it is today
      return formatISO(firstDayOfMonth);
    } else {
      // If today's date is later
      return formatISO(today);
    }
  }

  useEffect(() => {
    
    const graphStart = firstOrToday(activeDate);
    const graphEnd = formatISO(endOfMonth(addMonths(new Date(graphStart), graphSpan)));
    const colors: Record<string, string> = {};

    const accountBalances: number[][] = [];
const graphingAccounts : Account[] = [];
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

    const combinedData: CombinedData[] = [];
          let minY = Infinity;
          let maxY = -Infinity;

if (accountBalances.length != undefined) {
    for (let dayIndex = 0; dayIndex < accountBalances[0].length; dayIndex++) {
              const date = addDays(new Date(activeDate), dayIndex);
              const dayData: CombinedData = {
                date: format(date, 'M/d')
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
                  dayData[accounts[accountIndex].name] = balance;
      
                  minY = Math.min(minY, Number(balance));
                  maxY = Math.max(maxY, Number(balance));
                
              }
              
              setMinY(minY);
              setMaxY(maxY);

              let new_yTicks = [minY];
                    if (minY < 0 && maxY > 0) {
                      new_yTicks.push(0);
                    }
                    new_yTicks.push(maxY);
                  
                    setYTicks(new_yTicks);

              combinedData.push(dayData);
            }
          }
          setXTicks ([
            combinedData[0].date,
            combinedData[combinedData.length - 1].date,
          ]);
console.log(xTicks,yTicks)

  if (combinedData.length > 0) {
    const keys = Object.keys(combinedData[0]).filter(key => key !== 'date');
    setDataKeys(keys);
  } else {
    console.log("WHOOPS")
    setDataKeys([]);
  }



console.log(dataKeys,combinedData)


  }, [
        activeDate,
        accounts,
        state,
        graphSpan
      ])
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glassjar__custom-tooltip">
          <h3 className="label">{`${label}`}</h3>
          <table>
            <tbody>
              {payload.map(
                (entry: { color: any; name: any; value: any }, index: any) => (
                  <tr>
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

  if (accounts.length === 0) {
    return (
      <div>No accounts available. Please add an account to see the graph.</div>
    );
  }

  


  return (
    <div className="glassjar__graph-holder">
      <div className="glassjar__graph-holder__sub">
        <div className="glassjar__graph-holder__sub-sub">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" ticks={xTicks} />
              <YAxis
                ticks={yTicks}
                tickFormatter={currencyFormatter}
                width={75}
                domain={[minY, maxY]}
                tickCount={5}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                position="start"
                x={format(new Date(state.activeDates.activeDate), 'M/d')}
                stroke="#54816F"
              >
                <Label position={"right"}>
                  {format(new Date(state.activeDates.activeDate), 'M/d')}
                </Label>
              </ReferenceLine>
              {dataKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={accountColors[key]}
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glassjar__flex glassjar__flex--justify-between">
        <button onClick={() => setGraphSpan(3)}>3</button>
        <button onClick={() => setGraphSpan(6)}>6</button>
        <button onClick={() => setGraphSpan(12)}>12</button>
      </div>
    </div>
  );
};

export default OutlookGraph;

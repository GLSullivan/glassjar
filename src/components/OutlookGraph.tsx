import React, { useState, useEffect, useCallback  } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
}                                                   from "recharts";
import { useDispatch, useSelector }                 from "react-redux";

import { accountBalancesByDateRange }               from "./../redux/slices/projections";
import { setGraphSpan }                             from "./../redux/slices/activedates";
import { Account }                                  from "./../models/Account";
import { RootState }                                from "./../redux/store";

import "./../css/OutlookGraph.css";

const OutlookGraph: React.FC = () => {
  const state    = useSelector((state: RootState) => state);
  const dispatch = useDispatch();

  const [minY, setMinY] = useState<number>(0);
  const [maxY, setMaxY] = useState<number>(0);

  type CombinedData = {
    date         : string;
    [key: string]: number | string;
  };

  const formatDate = (date: Date): string => {
    const month = date.toLocaleString("en-us", { month: "numeric" });
    const day   = date.getDate();
    return ` ${month}/${day} `;
  };

  const accounts = state.accounts.accounts;

  const [combinedData, setCombinedData] = useState<CombinedData[]>([]);

  const currencyFormatter               = (item: any) =>
    item.toLocaleString("en-US", {
      style                : "currency",
      currency             : "USD",
      maximumFractionDigits: 0,
    });

    const combineAccountBalances = useCallback((
      accounts: Account[],
      accountBalances: number[][]
    ): { combinedData: CombinedData[]; minY: number; maxY: number } => {
      const combinedData: CombinedData[] = [];
      let   minY                         = Infinity;
      let   maxY                         = -Infinity;
  
      const today = new Date(Date.parse(state.activeDates.graphNearDate));
  
      for (let dayIndex = 0; dayIndex < accountBalances[0].length; dayIndex++) {
        const date                  = new Date(today.getTime() + dayIndex * 24 * 60 * 60 * 1000);
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

  const renderChart = (
    combinedData: CombinedData[],
    dataKeys    : string[],
    minY        : number,
    maxY        : number
  ) => {
    return (
      <div className="glassjar__graph-holder">
        <div className="glassjar__graph-holder__sub">
          <div className="glassjar__graph-holder__sub-sub">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
                  <YAxis
                    tickFormatter = {currencyFormatter}
                    width         = {75}
                    domain        = {[minY, maxY]}
                    tickCount     = {5}
                  />
                  <Tooltip />
                  {/* <Legend /> */}
                  <ReferenceLine
                    position = "start"
                    x        = {formatDate(new Date(state.activeDates.activeDate))}
                    stroke   = "#54816F"
                  >
                    <Label position = {"right"}>
                      {formatDate(new Date(state.activeDates.activeDate))}
                    </Label>
                  </ReferenceLine>
                  {dataKeys.map((key, index) => (
                    <Line
                      key         = {key}
                      type        = "monotone"
                      dataKey     = {key}
                      stroke      = {accounts[index].color}
                      strokeWidth = {2}
                      activeDot   = {{ r: 8 }}
                      dot         = {false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
          </div>
        </div>
        <div className="glassjar__flex glassjar__flex--justify-between">
          <button onClick   = {() => dispatch(setGraphSpan(3))}>3</button>
          <button onClick   = {() => dispatch(setGraphSpan(6))}>6</button>
          <button onClick   = {() => dispatch(setGraphSpan(12))}>12</button>
        </div>
        <h1></h1>
        
      </div>
    );
  };

  const dataKeys = Object.keys(combinedData[0] || {}).filter(
    (key) => key !== "date"
  );

  return renderChart(combinedData, dataKeys, minY, maxY);
};

export default OutlookGraph;

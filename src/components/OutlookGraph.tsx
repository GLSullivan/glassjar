import React, { useState, useEffect }     from "react";
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
}                                         from "recharts";
import { useDispatch, useSelector }       from "react-redux";

import { RootState }                      from "./../redux/store";
import { accountBalancesByDateRange }     from "./../redux/slices/projections";
import { Account }                        from "./../models/Account";
import { setGraphSpan }                   from './../redux/slices/activedates';

import "./../css/OutlookGraph.css";

const OutlookGraph: React.FC = () => {
  const state = useSelector((state: RootState) => state);
  const dispatch = useDispatch();

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
  const currencyFormatter = (item: any) => item.toLocaleString("en-US", { style: "currency", currency: "USD",  maximumFractionDigits: 0, });

  useEffect(() => {
    const accountBalances: number[][] = accounts.map((account) =>
      (
        accountBalancesByDateRange (
        state,
        account.id,
        state.activeDates.graphNearDate,
        state.activeDates.graphFarDate
      ) as number[])
    );

    const newCombinedData = combineAccountBalances(accounts, accountBalances);
    setCombinedData(newCombinedData);
  }, [state.activeDates.graphNearDate, state.activeDates.graphFarDate, accounts]);

  if (accounts.length === 0) {
    return <div>No accounts available. Please add an account to see the graph.</div>;
  }

  const combineAccountBalances = (
  accounts       : Account[],
  accountBalances: number[][]
  )              : CombinedData[] => {
    const combinedData: CombinedData[] = [];

    const today = new Date(Date.parse(state.activeDates.graphNearDate));

    for (let dayIndex = 0; dayIndex < accountBalances[0].length; dayIndex++) {


      const date                  = new Date(today.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      const dayData: CombinedData = {
        date: formatDate(date),
      };

      for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
        if (accounts[accountIndex].showInGraph) {
          let multiplier = 1;
          if (accounts[accountIndex].isLiability) {
            multiplier = -1; // Invert graph for liabilities. Future user setting?
          }
          dayData[accounts[accountIndex].name] = (accountBalances[accountIndex][dayIndex] * multiplier).toFixed(2);
        }
      }

      combinedData.push(dayData);
    }

    return combinedData;
  };

  const renderChart = (combinedData: CombinedData[], dataKeys: string[]) => {
    return (
      <div className="glassjar__graph-holder">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={currencyFormatter} width={75}/>
          <Tooltip />
          <Legend />
          <ReferenceLine position="start" x={formatDate(new Date(state.activeDates.activeDate))} stroke="#54816F" >
            <Label position={"right"}>{formatDate(new Date(state.activeDates.activeDate))}</Label>
          </ReferenceLine>

          {dataKeys.map((key,index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={accounts[index].color}
              strokeWidth={2}
              activeDot={{ r: 8 }}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
        <div className="glassjar__flex glassjar__flex--justify-between">
          <button onClick={() => dispatch(setGraphSpan(1))}>1</button>
          <button onClick={() => dispatch(setGraphSpan(6))}>6</button>
          <button onClick={() => dispatch(setGraphSpan(12))}>12</button>
        </div>
      </div>
    );
  };

  const dataKeys = Object.keys(combinedData[0] || {}).filter((key) => key !== "date");

  return renderChart(combinedData, dataKeys);
};

export default OutlookGraph;
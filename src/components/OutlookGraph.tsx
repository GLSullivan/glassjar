import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import {
  selectBalanceByDateAndAccount,
} from "./../redux/slices/projections";
import { Account } from "../models/Account";

import "./../css/Calendar.css";

const OutlookGraph: React.FC = () => {
  const state = useSelector((state: RootState) => state);

  type CombinedData = {
    date: string;
    [key: string]: number | string;
  };

  const formatDate = (date: Date): string => {
    const month = date.toLocaleString("en-us", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const accountBalances: number[][] = state.accounts.accounts.map((account) =>
    (selectBalanceByDateAndAccount(
      state,
      account,
      true,
      state.activeDates.graphNearDate,
      state.activeDates.graphFarDate
    ) as number[])
  );

  const combineAccountBalances = (
    accounts: Account[],
    accountBalances: number[][]
  ): CombinedData[] => {
    const combinedData: CombinedData[] = [];

    const today = new Date(Date.parse(state.activeDates.nearDate));

    for (let dayIndex = 0; dayIndex < accountBalances[0].length; dayIndex++) {
      const date = new Date(today.getTime() + dayIndex * 24 * 60 * 60 * 1000);
      const dayData: CombinedData = {
        date: formatDate(date),
      };

      for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
        dayData[accounts[accountIndex].name] = accountBalances[accountIndex][dayIndex];
      }

      combinedData.push(dayData);
    }

    return combinedData;
  };

  const generateColor = (key: string) => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }
    return color;
  };

  const accounts = state.accounts.accounts;
  const combinedData = combineAccountBalances(accounts, accountBalances);
console.log(combinedData)
  const dataKeys = Object.keys(combinedData[0]).filter((key) => key !== "date");

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={combinedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={generateColor(key)}
            activeDot={{ r: 8 }}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default OutlookGraph;

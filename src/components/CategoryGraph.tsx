import { useSelector }      from "react-redux";
import { getCategorySpend } from "../redux/slices/projections";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
}                           from "recharts";

const CategorySpendPieChart = () => {
  const categorySpendData = useSelector(getCategorySpend);
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#8dd1e1",
  ];

  const formattedData = Object.entries(categorySpendData).map(
    ([name, value]) => ({
      name,
      value,
    })
  );
console.log(formattedData)

  // const renderCustomLegend = () => {
  //   const total = formattedData.reduce((acc, cur) => acc + cur.value, 0);
  //   const percentage = ((entry.value / total) * 100).toFixed(2);
  //   return `${entry.name}: ${percentage}%`;
  // };

  return (
    <div className="glassjar__graph-holder">
      <div className="glassjar__graph-holder__sub">
        <div className="glassjar__graph-holder__sub-sub">
          <ResponsiveContainer width="100%" height="100%">
            {/* <PieChart width={400} height={400}> */}
            <PieChart>
              <Pie
                data        = {formattedData}
                // cx          = {200}
                // cy          = {200}
                labelLine   = {false}
                outerRadius = {100}
                fill        = "#8884d8"
                dataKey     = "value"
                // label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
              >
                {formattedData.map((entry, index) => (
                  <Cell
                    key  = {`cell-${index}`}
                    fill = {COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
              {/* <Legend formatter={renderCustomLegend} /> */}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CategorySpendPieChart;


// console.log(state.categorySpend)
//       console.log(
//         Object.entries(state.categorySpend).map(([category, spend]) => ({
//           category,
//           percentage:
//             Number((spend /
//               Object.values(state.categorySpend).reduce(
//                 (acc, curr) => acc + curr,
//                 0
//               )) *
//             100).toFixed(2),
//         }))
//       );
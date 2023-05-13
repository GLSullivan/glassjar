import { useSelector }        from "react-redux";
import { getCategorySpend }   from "../redux/slices/projections";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
}                             from "recharts";
import { RecurringExpenses }  from "../data/RecurringExpenses";

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

  const getCategoryPercentage = (categoryName: any) => {
    const [beforeColon] = categoryName.split(':');
    const category = RecurringExpenses.find((item: { category: any; }) => item.category === beforeColon);
    if (category) {
      return category.percentage;
    }
    return null;
  };
  
  const formattedData = Object.entries(categorySpendData).map(([category, spend]) => ({
    name: category + ": " +  ((spend / Object.values(categorySpendData).reduce((acc, curr) => acc + curr, 0)) * 100).toFixed(2) + "%",
    value: Number(((spend / Object.values(categorySpendData).reduce((acc, curr) => acc + curr, 0)) * 100).toFixed(2)),
  }));
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const fill             = payload[0]?.payload?.fill;
      const targetPercentage = getCategoryPercentage(payload[0].name)
      return (
        <div
          style={{ border: `2px solid ${fill}` }}
          className="glassjar__custom-tooltip"
        >
          <h3>{payload[0].name}</h3>
          <h4>Recommended: {Number(targetPercentage) * 100}%</h4>
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="glassjar__graph-holder">
      <div className="glassjar__graph-holder__sub">
        <div className="glassjar__graph-holder__sub-sub">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data        = {formattedData}
                labelLine   = {true}
                outerRadius = {100}
                innerRadius = {60}
                fill        = "#8884d8"
                dataKey     = "value"
              >
                {formattedData.map((entry, index) => (
                  <Cell
                    key  = {`cell-${index}`}
                    fill = {COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CategorySpendPieChart;
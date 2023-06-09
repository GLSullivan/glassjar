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
import { colorPalette } from "../data/ColorPalette";

const CategorySpendPieChart = () => {
  const categorySpendData = useSelector(getCategorySpend);
  const COLORS = colorPalette;

  const getCategoryPercentage = (categoryName: any) => {
    const [beforeColon] = categoryName.split(':');
    const category = RecurringExpenses.find((item: { category: any; }) => item.category === beforeColon);
    if (category) {
      return category.percentage;
    }
    return null;
  };
  
  const formattedData = Object.entries(categorySpendData)
  .filter(([category]) => category !== "None")
  .map(([category, spend]) => {
    const total = Object.values(categorySpendData)
      .reduce((acc, curr) => acc + curr, 0);
    
    const percentage = ((spend / total) * 100).toFixed(2);
    
    return {
      name: `${category}: ${percentage}%`,
      value: Number(percentage),
    };
});


  
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
      <h2>Spending Categories</h2>
      <div className="glassjar__graph-holder__sub">
        <div className="glassjar__graph-holder__sub-sub">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data        = {formattedData}
                labelLine   = {true}
                outerRadius = {120}
                innerRadius = {10}
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
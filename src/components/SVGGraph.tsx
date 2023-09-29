import React, { useState, useEffect, useRef } from 'react';

// DataPoint and DataSet types
type DataPoint = { date: Date; value: number };
type DataSet = { name: string; data: DataPoint[]; color: string };
  
const calculateRollingAverage = (dataSets: DataSet[], rollingDays: number) => {
  if (!dataSets || dataSets.length === 0) {
    return [];
  }

  const aggregateData: DataPoint[] = [];

  // Assuming all datasets have the same dates
  const dates = dataSets[0].data.map(d => d.date);

  dates.forEach((date, i) => {
    const aggregateValue = dataSets.reduce((sum, dataSet) => {
      return sum + dataSet.data[i].value;
    }, 0);

    aggregateData.push({ date, value: aggregateValue / dataSets.length });
  });

  const rollingAverageData: DataPoint[] = [];

  for (let i = 0; i < aggregateData.length; i++) {
    const start = Math.max(0, i - rollingDays + 1);
    const end = i + 1;
    const slice = aggregateData.slice(start, end);
    const avg = slice.reduce((sum, point) => sum + point.value, 0) / slice.length;

    rollingAverageData.push({ date: aggregateData[i].date, value: avg });
  }

  return rollingAverageData;
};
  
// Custom hook for generating multiple lines
const useMultiLineGraph = (dataSets: DataSet[], width: number, height: number) => {
  const [paths, setPaths] = useState<{ [key: string]: string }>({});
    
  // Calculate the rolling average data
  const rollingAverageData = calculateRollingAverage(dataSets, 7); // 7-day rolling average
  
  // Create a new DataSet for the rolling average
  const rollingAverageDataSet: DataSet = {
    name: 'Rolling Average',
    data: rollingAverageData,
    color: '#e2e3e4',
  };

  useEffect(() => {
    if (!dataSets || dataSets.length === 0 || !dataSets[0].data || dataSets[0].data.length === 0) {
      return; // Exit if data is not yet available
    }
  
    let newPaths: { [key: string]: string } = {};
  
  
    // Recalculate yMin and yMax including the rolling average
    let allValues = dataSets.flatMap(dataSet => dataSet.data.map(point => point.value));
    const yMin = Math.min(...allValues);
    const yMax = Math.max(...allValues);
  
    // Define margins (5% of the height for this example)
    const marginTop = 0.05 * height;
    const marginBottom = 0.05 * height;
  
    // Adjusted height after accounting for margins
    const adjustedHeight = height - marginTop - marginBottom;
  
    const xMin = dataSets[0].data[0].date.getTime();
    const xMax = dataSets[0].data[dataSets[0].data.length - 1].date.getTime();
  
    const xScale = (date: Date) => ((date.getTime() - xMin) / (xMax - xMin)) * width;
    const yScale = (value: number) => ((value - yMin) / (yMax - yMin)) * adjustedHeight;
  
    dataSets.forEach((dataSet) => {
      const data = dataSet.data;
      let pathData = 'M ' + xScale(data[0].date) + ' ' + (height - yScale(data[0].value) - marginBottom);
  
      // Generate straight lines for other datasets
      for (let i = 1; i < data.length; i++) {
        pathData += ' L ' + xScale(data[i].date) + ' ' + (height - yScale(data[i].value) - marginBottom);
      }
  
      newPaths[dataSet.name] = pathData;
    });
  
    // Generate path for rolling average separately
    let rollingAveragePath = 'M ' + xScale(rollingAverageDataSet.data[0].date) + ' ' + (height - yScale(rollingAverageDataSet.data[0].value) - marginBottom);
    for (let i = 1; i < rollingAverageDataSet.data.length; i++) {
      const x1 = xScale(rollingAverageDataSet.data[i - 1].date);
      const y1 = height - yScale(rollingAverageDataSet.data[i - 1].value) - marginBottom;
      const x2 = xScale(rollingAverageDataSet.data[i].date);
      const y2 = height - yScale(rollingAverageDataSet.data[i].value) - marginBottom;
  
      const cx1 = (x1 + x2) / 2;
      const cy1 = y1;
      const cx2 = (x1 + x2) / 2;
      const cy2 = y2;
  
      rollingAveragePath += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    }
    newPaths['Rolling Average'] = rollingAveragePath;
  
    setPaths(newPaths);
    // eslint-disable-next-line
  }, [dataSets, width, height]);
  
  return { paths, rollingAverageDataSet };
};

// Main SVG Graph Component
type SVGGraphProps = {
  dataSets: DataSet[];
};

const SVGGraph: React.FC<SVGGraphProps> = ({ dataSets }) => {
  
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const { paths, rollingAverageDataSet } = useMultiLineGraph(dataSets, dimensions.width, dimensions.height);

  const updateDimensions = () => {
    if (containerRef.current) {
      const { width, height } = (containerRef.current as HTMLElement).getBoundingClientRect();
      setDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateDimensions(); // Initial dimensions
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef]);

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = (containerRef.current as HTMLElement).getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, [containerRef]);

  // Calculate yMin and yMax including the rolling average
  let allValues = dataSets.flatMap(dataSet => dataSet.data.map(point => point.value));
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);

  // Define margins (5% of the height for this example)
  const marginTop = 0.05 * dimensions.height;
  const marginBottom = 0.05 * dimensions.height;

  // Adjusted height after accounting for margins
  const adjustedHeight = dimensions.height - marginTop - marginBottom;

  const yScale = (value: number) => ((value - yMin) / (yMax - yMin)) * adjustedHeight;

  // Check if 0 is within the display range
  const shouldDisplayZeroLine = yMin <= 0 && yMax >= 0;

  function roundToNearestPow(value: number): number {
    const digits = Math.ceil(Math.log10(Math.abs(value) + 1));
    const pow = Math.pow(10, digits > 4 ? digits - 3 : digits);
    return Math.round(value / pow) * pow;
  }
  
  function formatToAttractiveCurrency(num: number): string {
    if (num === 0) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(0);
  
    const rounded = roundToNearestPow(Math.abs(num));
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num < 0 ? -rounded : rounded);
  }
  
  const formattedMin = formatToAttractiveCurrency(yMin);
  const formattedMax = formatToAttractiveCurrency(yMax);

  return (
    <div ref={containerRef}>
      <svg width="100%" height="100%">

        <path
          key={rollingAverageDataSet.name}
          d={paths[rollingAverageDataSet.name]}
          stroke={rollingAverageDataSet.color}
          strokeWidth="16"
          fill="none"
        />

        {shouldDisplayZeroLine && (
          <line
            x1="0"
            y1={dimensions.height - yScale(0) - marginBottom}
            x2={dimensions.width}
            y2={dimensions.height - yScale(0) - marginBottom}
            stroke="#8f8f8f"
            strokeWidth="1"
            stroke-dasharray="10,10" d="M5 40 l215 0" 
          />
        )}

        {Object.keys(paths).map((key) => {
          if (key === 'Rolling Average') return null;  // Skip the rolling average line
          const color = dataSets.find((d) => d.name === key)?.color || 'black';
          return <path key={key} d={paths[key]} stroke={color} fill="none" />;
        })}
      </svg>

      <div className="glassjar__graph-range glassjar__graph-range-max">{formattedMax}</div>
      <div className="glassjar__graph-range glassjar__graph-range-min">{formattedMin}</div>

    </div>
  );
};

export default SVGGraph;






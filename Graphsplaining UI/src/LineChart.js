import React from "react";
import Chart from "react-apexcharts";

const LineChart = ({options}) => {
  if (options == null || options.series == null)
    return null;
  return (
    <div className="mixed-chart">
      <Chart
        options={options}
        series={options.series}
        type="line"
        // width="380"
      />
    </div>
  );
};

export default LineChart;

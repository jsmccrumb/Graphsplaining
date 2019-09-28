import React from "react";
import Chart from "react-apexcharts";

const DonutChart = ({options}) => {
  if (options == null || options.series == null)
    return null;
  return (
    <div className="donut">
      <Chart
        options={options}
        series={options.series}
        type="donut"
      />
    </div>
  );
};

export default DonutChart;

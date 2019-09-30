import React from "react";
import Chart from "react-apexcharts";

const HeatMap = ({options}) => {
  if (options == null || options.series == null)
    return null;
  return (
    <div className="mixed-chart">
      <Chart
        options={options}
        series={options.series}
        type="heatmap"
      />
    </div>
  );
};

export default HeatMap;

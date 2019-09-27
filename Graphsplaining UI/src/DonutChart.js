import React, { Component } from "react";
import Chart from "react-apexcharts";

class DonutChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: {
        legend: {
          show: true,
          position: "bottom"
        },
        series: [44, 55, 41, 17, 15],
        labels: ["A", "B", "C", "D", "E"]
      }
    };
  }

  render() {
    return (
      <div className="donut">
        <Chart
          options={this.state.options}
          series={this.state.options.series}
          type="donut"
          // width="380"
        />
      </div>
    );
  }
}

export default DonutChart;

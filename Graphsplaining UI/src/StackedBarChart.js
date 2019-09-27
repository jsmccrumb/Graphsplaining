import React, { Component } from "react";
import Chart from "react-apexcharts";

class StackedBarChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: {
        chart: {
          height: 350,
          type: "bar",
          stacked: true
        },
        plotOptions: {
          bar: {
            horizontal: true
          }
        },
        stroke: {
          width: 1,
          colors: ["#fff"]
        },
        series: [
          {
            name: "Marine Sprite",
            data: [44, 55, 41, 37, 22, 43, 21]
          },
          {
            name: "Striking Calf",
            data: [53, 32, 33, 52, 13, 43, 32]
          },
          {
            name: "Tank Picture",
            data: [12, 17, 11, 9, 15, 11, 20]
          },
          {
            name: "Bucket Slope",
            data: [9, 7, 5, 8, 6, 9, 4]
          },
          {
            name: "Reborn Kid",
            data: [25, 12, 19, 32, 25, 24, 10]
          }
        ],
        title: {
          text: "Fiction Books Sales"
        },
        xaxis: {
          categories: [2008, 2009, 2010, 2011, 2012, 2013, 2014],
          labels: {
            formatter: function(val) {
              return val + "K";
            }
          }
        },
        yaxis: {
          title: {
            text: undefined
          }
        },
        tooltip: {
          y: {
            formatter: function(val) {
              return val + "K";
            }
          }
        },
        fill: {
          opacity: 1
        },

        legend: {
          position: "top",
          horizontalAlign: "left",
          offsetX: 40
        }
      }
    };
  }

  render() {
    return (
      <div className="bar">
        <Chart
          options={this.state.options}
          series={this.state.options.series}
          type="bar"
          // width="380"
        />
      </div>
    );
  }
}

export default StackedBarChart;

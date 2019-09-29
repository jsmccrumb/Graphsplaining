//   function generateData(count, yrange) {
//     var i = 0;
//     var series = [];
//     while (i < count) {
//         var x = 'w' + (i + 1).toString();
//         var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

//         series.push({
//             x: x,
//             y: y
//         });
//         i++;
//     }
//     return series;
// }

// var options = {
//     chart: {
//         height: 350,
//         type: 'heatmap',
//     },
//     dataLabels: {
//         enabled: false
//     },
//     colors: ["#008FFB"],
//     series: [{
//             name: 'Metric1',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         },
//         {
//             name: 'Metric2',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         },
//         {
//             name: 'Metric3',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         },
//         {
//             name: 'Metric4',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         },
//         {
//             name: 'Metric5',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         },
//         {
//             name: 'Metric6',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         },
//         {
//             name: 'Metric7',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         },
//         {
//             name: 'Metric8',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         },
//         {
//             name: 'Metric9',
//             data: generateData(18, {
//                 min: 0,
//                 max: 90
//             })
//         }
//     ],
//     title: {
//         text: 'HeatMap Chart (Single color)'
//     },

// }

// var chart = new ApexCharts(
//     document.querySelector("#chart"),
//     options
// );

// chart.render();

import React, { Component } from "react";
import Chart from "react-apexcharts";

class HeatMap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: {
        /*plotOptions: {
          heatmap: {
            colorScale: {
              ranges: [
                {
                  from: -30,
                  to: 5,
                  color: "#00A100",
                  name: "low"
                },
                {
                  from: 6,
                  to: 20,
                  color: "#128FD9",
                  name: "medium"
                },
                {
                  from: 21,
                  to: 45,
                  color: "#FFB200",
                  name: "high"
                }
              ]
            }
          }
        },*/
        chart: {
          height: 350,
          type: 'heatmap',
        },
        colors: ["#008FFB"],
        series: [
          {
            name: "Series 1",
            data: [
              {
                x: "W1",
                y: 22
              },
              {
                x: "W2",
                y: 29
              },
              {
                x: "W3",
                y: 13
              },
              {
                x: "W4",
                y: 32
              }
            ]
          },
          {
            name: "Series 2",
            data: [
              {
                x: "W1",
                y: 43
              },
              {
                x: "W2",
                y: 43
              },
              {
                x: "W3",
                y: 43
              },
              {
                x: "W4",
                y: 43
              }
            ]
          }
        ]
      }
    };
  }

  render() {
    return (
      <div className="mixed-chart">
        <Chart
          options={this.state.options}
                 series={this.state.options.series}
          type="heatmap"
          // width="380"
        />
      </div>
    );
  }
}

export default HeatMap;

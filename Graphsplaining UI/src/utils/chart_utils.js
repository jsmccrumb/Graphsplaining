import graphUtils from './graph_utils';

const baseLineChartOptions = {
  chart: {
    height: 350,
    type: "line",
    stacked: false
  },
  dataLabels: {
    enabled: false
  },
  colors: ["#FF1654", "#247BA0", "#00FBB6"],
  series: [
    {
      name: "Series A",
      data: [1.4, 2, 2.5, 1.5, 2.5, 2.8, 3.8, 4.6]
    },
    {
      name: "Series B",
      data: [20, 29, 37, 36, 44, 45, 50, 58]
    }
  ],
  stroke: {
    width: [4, 4]
  },
  plotOptions: {
    bar: {
      columnWidth: "20%"
    }
  },
  xaxis: {
    categories: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016]
  },
  yaxis: [
    {
      axisTicks: {
        show: true
      },
      axisBorder: {
        show: true,
        color: "#FF1654"
      },
      labels: {
        style: {
          color: "#FF1654"
        }
      },
      title: {
        text: "Count"
      }
    },
  ],
  tooltip: {
    shared: false,
    intersect: true,
    x: {
      show: true
    }
  },
  legend: {
    horizontalAlign: "left",
    offsetX: 40
  }
}

const convertQueryCounts = ([{records: queryLogRecords = []}, {records: explainRecords = []}]) => {
  const hasQueryLog = queryLogRecords.length > 0;
  let countObject = {};
  if (hasQueryLog) {
    countObject = queryLogRecords.reduce((acc, record) => {
      acc[record.get('date')] = {
        queryLogCount: graphUtils.safeInteger(record.get('queryLogs')),
        explainCount: 0,
        violationCount: 0,
      };
      return acc;
    }, countObject);
  }
  countObject = explainRecords.reduce((acc, record) => {
    if (acc[record.get('date')] != null) {
      acc[record.get('date')].explainCount = graphUtils.safeInteger(record.get('explains'));
      acc[record.get('date')].violationCount = graphUtils.safeInteger(record.get('violatesCheck'));
    } else {
      acc[record.get('date')] = {
        queryLogCount: 0,
        explainCount: graphUtils.safeInteger(record.get('explains')),
        violationCount: graphUtils.safeInteger(record.get('violatesCheck')),
      };
    }
    return acc;
  }, countObject);
  // date is key of object so do not need to handle a === b
  const dates = Object.keys(countObject).sort((a, b) => a > b ? 1 : -1);
  const series = [
    {
      name: 'Explains Ran',
      data: dates.map(d => countObject[d].explainCount)
    },
    {
      name: 'Explains Violating Performance Checks',
      data: dates.map(d => countObject[d].violationCount)
    },
  ];
  if (hasQueryLog) {
    series.push({
      name: 'Query Log Entries',
      data: dates.map(d => countObject[d].queryLogCount),
    });
  }
  return {
    ...baseLineChartOptions,
    series,
    xaxis: {
      categories: dates
    }
  };
};

const baseDonutChartOptions = {
  legend: {
    show: true,
    position: "bottom"
  },
  series: [44, 55, 41, 17, 15],
  labels: ["A", "B", "C", "D", "E"]
};

const convertLatestStats = ({records = []}) => {
  const getLabelFromRecord = (record) => {
    const hasViolation = record.get('hasViolation');
    const hasIndex = record.get('hasIndex');
    if (hasViolation && hasIndex) {
      return 'Violates Performance Check and Has Suggested Index';
    } else if (!hasViolation && hasIndex) {
      return 'Has Suggested Index';
    } else if (hasViolation && !hasIndex) {
      return 'Violates Performance Check';
    } else if (!hasViolation && !hasIndex) {
      return 'No Known Issues';
    }
  };
  const stats = Object.entries(records.reduce((acc, record) => {
    acc[getLabelFromRecord(record)] = graphUtils.safeInteger(record.get('count'));
    return acc;
  }, {}));

  return {
    ...baseDonutChartOptions,
    series: stats.map(([label, data]) => data),
    labels: stats.map(([label, data]) => label),
  };
}

const baseHeatMapOptions = {
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
};

const convertQueryTimes = ({records = []}) => {
  const parsed = records.map(r => ({date: r.get('date'), category: r.get('category'), count: graphUtils.safeInteger(r.get('count'))}));
  const dates = new Set(parsed.map(r => r.date).sort((a, b) => a < b ? 1 : a > b ? -1 : 0));
  const categories = new Set(parsed.map(r => r.category));
  const getCount = ({date, category}) => {
    const record = parsed.filter(r => r.date === date && r.category === category)[0];
    return record == null ? 0 : record.count;
  };
  const series = [...categories].map((cat) => {
    return {
      name: cat,
      data: [...dates].map(d => ({x: d, y: getCount({date: d, category: cat})}))
    };
  }).sort((a,b) => a.name.length > b.name.length ? 1 : a.name.length < b.name.length ? -1 : 0);
  return {...baseLineChartOptions, series};
};


export default {
  convertQueryCounts,
  convertLatestStats,
  convertQueryTimes,
};

import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import DonutChart from "./DonutChart.js";
import LineChart from "./LineChart.js";
import HeatMap from "./HeatMap.js";
import StackedBarChart from "./StackedBarChart.js";
import Loading from "./Loading";

import graphUtils from "./utils/graph_utils";
import chartUtils from "./utils/chart_utils";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: "center",
    color: theme.palette.text.secondary
  }
}));

export default function MetricsGrid() {
  const classes = useStyles();
  const [queryCounts, setQueryCounts] = useState(null);
  const [latestStats, setLatestStats] = useState(null);
  const [queryTimes, setQueryTimes] = useState(null);
  useEffect(() => {
    (async () => {
      const qcResults = await graphUtils.getQueryCountsAsync();
      qcResults != null && setQueryCounts(chartUtils.convertQueryCounts(qcResults));
      const lsResults = await graphUtils.getLatestStatsAsync();
      lsResults != null && setLatestStats(chartUtils.convertLatestStats(lsResults));
      const qtResults = await graphUtils.getQueryTimesAsync();
      qtResults != null && setQueryTimes(chartUtils.convertQueryTimes(qtResults));
    })();
  }, []);

  return (
    <div className={classes.root}>
      <Grid container justify="center" spacing={3}>
        <Grid item xs={12} md={8} lg={6}>
          <Paper className={classes.paper}>
            {queryCounts == null ? <Loading message="Loading Query Count Info" /> : <LineChart options={queryCounts} />}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={6}>
          <Paper className={classes.paper}>
            {queryTimes == null ? <Loading message="Loading Query times per Day" /> : <HeatMap options={queryTimes} />}
          </Paper>
        </Grid>
        <Grid item xs={6} md={4}>
          <Paper className={classes.paper}>
            {latestStats == null ? <Loading message="Loading Latest Stats per Statement" /> : <DonutChart options={latestStats} />}
          </Paper>
        </Grid>
        {/*<Grid item xs={12} md={8} lg={6}>
          <Paper className={classes.paper}>
            <StackedBarChart />
          </Paper>
        </Grid>*/}
      </Grid>
    </div>
  );
}

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
  useEffect(() => {
    (async () => {
      const results = await graphUtils.getQueryCountsAsync();
      setQueryCounts(chartUtils.convertQueryCounts(results));
      console.log(results);
    })();
  }, []);

  return (
    <div className={classes.root}>
      <Grid container justify="center" spacing={3}>
        <Grid item xs={12} md={8} lg={6}>
          {/* <Paper className={classes.paper}>xs=12</Paper> */}
          <Paper className={classes.paper}>
            {queryCounts == null ? <Loading message="Loading Query Count Info" /> : <LineChart options={queryCounts} />}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={6}>
          {/* <Paper className={classes.paper}>xs=12</Paper> */}
          <Paper className={classes.paper}>
            <HeatMap />
          </Paper>
        </Grid>
        <Grid item xs={6} md={4}>
          {/* <Paper className={classes.paper}>xs=6</Paper> */}
          <Paper className={classes.paper}>
            <DonutChart />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8} lg={6}>
          <Paper className={classes.paper}>
            <StackedBarChart />
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper className={classes.paper}>xs=3</Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper className={classes.paper}>xs=3</Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper className={classes.paper}>xs=3</Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper className={classes.paper}>xs=3</Paper>
        </Grid>
      </Grid>
    </div>
  );
}

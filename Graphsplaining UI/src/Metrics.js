import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import DonutChart from "./DonutChart.js";
import LineChart from "./LineChart.js";
import HeatMap from "./HeatMap.js";
import StackedBarChart from "./StackedBarChart.js";

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

  return (
    <div className={classes.root}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {/* <Paper className={classes.paper}>xs=12</Paper> */}
          <Paper className={classes.paper}>
            <LineChart />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          {/* <Paper className={classes.paper}>xs=12</Paper> */}
          <Paper className={classes.paper}>
            <HeatMap />
          </Paper>
        </Grid>
        <Grid item xs={4}>
          {/* <Paper className={classes.paper}>xs=6</Paper> */}
          <Paper className={classes.paper}>
            <DonutChart />
          </Paper>
        </Grid>
        <Grid item xs={8}>
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

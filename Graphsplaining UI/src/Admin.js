import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import SelectedListItem from "./PerformanceCheckList.js";
import Loading from "./Loading";
import FilledTextFields from "./PerformanceCheckForm.js";
import PerformanceCheck from "./PerformanceCheckSelected.js";
import graphUtils from "./utils/graph_utils";

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

export default function AdminGrid() {
  const classes = useStyles();
  const [checkList, setCheckList] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    (async () => {
      const result = await graphUtils.getPerformanceChecksAsync();
      if (result != null && result.records != null) {
        setCheckList(result.records.map(r => r.get('check')));
      } else {
        setCheckList([]);
      }
    })();
  }, []);

  return (
    <div className={classes.root}>
      <Grid container spacing={3} alignItems="stretch" direction="row">
        <Grid item xs={4}>
          <Paper className={classes.paper}>
            {checkList == null ? <Loading message="Getting List of Performance Checks" /> : <SelectedListItem selectItem={setSelectedItem} checkList={checkList} selectedItem={selectedItem} />}
          </Paper>
        </Grid>
        <Grid item xs={8}>
          {/* <Paper className={classes.paper} textAlign="left"> */}
          <PerformanceCheck check={selectedItem} />
          {/* </Paper> */}
        </Grid>
        <Grid item xs={12}>
          {/* <Paper className={classes.paper}> */}
          <FilledTextFields />
          {/* </Paper> */}
        </Grid>
      </Grid>
    </div>
  );
}

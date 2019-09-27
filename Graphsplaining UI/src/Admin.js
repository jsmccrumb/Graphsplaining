import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import SelectedListItem from "./ValidationCheckList.js";
import FilledTextFields from "./ValidationCheckForm.js";
import ValidationCheck from "./ValidationCheckSelected.js";

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

  return (
    <div className={classes.root}>
      <Grid container spacing={3} alignItems="stretch" direction="row">
        <Grid item xs={4}>
          <Paper className={classes.paper}>
            <SelectedListItem />
          </Paper>
        </Grid>
        <Grid item xs={8}>
          {/* <Paper className={classes.paper} textAlign="left"> */}
          <ValidationCheck />
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

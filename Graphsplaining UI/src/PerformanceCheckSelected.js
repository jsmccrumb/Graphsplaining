import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

import graphUtils from './utils/graph_utils';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3, 2)
  }
}));

export default function PaperSheet({check}) {
  const classes = useStyles();
  const violationCheckStart = graphUtils.violationCheckStart;
  if (check == null) {
    return (
      <div>
        <Paper className={classes.root}>
          <Typography variant="h5" component="h3">
            Select a validation check from the left to view details
          </Typography>
        </Paper>
      </div>
    );
  }

  return (
    <div>
      <Paper className={classes.root}>
        <Typography variant="h5" component="h3">
          {check.name} - Severity: {check.severity}
        </Typography>
        <Typography variant="h6" component="h3">
          {check.description}
        </Typography>
        <Typography component="p" style={{whiteSpace: 'pre-line'}}>
          {violationCheckStart}
          <br />
          {check.violationCheck}
        </Typography>
      </Paper>
    </div>
  );
}

import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3, 2)
  }
}));

export default function PaperSheet() {
  const classes = useStyles();

  return (
    <div>
      <Paper className={classes.root}>
        <Typography variant="h5" component="h3">
          Selected Validation Check Name
        </Typography>
        <Typography variant="h6" component="h3">
          Selected Validation Check Description
        </Typography>
        <Typography component="p">
          Selected Validation Check Cypher Statment
        </Typography>
      </Paper>
    </div>
  );
}

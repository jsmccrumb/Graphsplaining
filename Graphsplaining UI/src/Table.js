import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import graphUtils from "./utils/graph_utils";
import Loading from "./Loading";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing(3),
    overflowX: "auto"
  },
  table: {
    minWidth: 650
  }
}));

export default function SimpleTable() {
  const classes = useStyles();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    (async () => {
      const indexes = await graphUtils.getIndexRecommendations();
      if (indexes == null) {
        setRows([]);
      } else {
        setRows(indexes);
      }
    })();
  });

  return (
    <Paper className={classes.root}>
      <Typography variant="h5" component="h3">
        Potential Indexes
      </Typography>
      {rows == null ? <Loading /> :
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Label</TableCell>
            <TableCell align="right">Property</TableCell>
            <TableCell align="right">Times Recommended</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.label}>
              <TableCell component="th" scope="row">
                {row.label}
              </TableCell>
              <TableCell align="right">{row.property}</TableCell>
              <TableCell align="right">{row.timesRecommended}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>}
    </Paper>
  );
}

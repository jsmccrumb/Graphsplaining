import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";

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

function createData(statement, violations, averageTime, minTime, maxTime) {
  return { statement, violations, averageTime, minTime, maxTime };
}

const rows = [
  createData("Frozen yoghurt", 159, 6.0, 24, 4.0),
  createData("Ice cream sandwich", 237, 9.0, 37, 4.3),
  createData("Eclair", 262, 16.0, 24, 6.0),
  createData("Cupcake", 305, 3.7, 67, 4.3),
  createData("Gingerbread", 356, 16.0, 49, 3.9)
];

export default function SimpleTable2() {
  const classes = useStyles();

  return (
    <Paper className={classes.root}>
      <Typography variant="h5" component="h3">
        Potential Bottlenecks
      </Typography>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Statement</TableCell>
            <TableCell align="right">Violations</TableCell>
            <TableCell align="right">Avg Time (ms)</TableCell>
            <TableCell align="right">Min Time (ms)</TableCell>
            <TableCell align="right">Max Time (ms)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.statement} hover>
              <Tooltip title="Full cypher statement" placement="bottom-start">
                <TableCell component="th" scope="row">
                  {row.statement}
                </TableCell>
              </Tooltip>
              <TableCell align="right">{row.violations}</TableCell>
              <TableCell align="right">{row.averageTime}</TableCell>
              <TableCell align="right">{row.minTime}</TableCell>
              <TableCell align="right">{row.maxTime}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

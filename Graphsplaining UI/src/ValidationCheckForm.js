import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
// import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";

import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";

// const currencies = [
//   {
//     value: "USD",
//     label: "$"
//   },
//   {
//     value: "EUR",
//     label: "€"
//   },
//   {
//     value: "BTC",
//     label: "฿"
//   },
//   {
//     value: "JPY",
//     label: "¥"
//   }
// ];

const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1)
  },
  dense: {
    marginTop: theme.spacing(2)
  },
  menu: {
    width: 200
  },
  button: {
    margin: theme.spacing(1)
  },
  input: {
    display: "none"
  },
  card: {
    // maxWidth: 345
  }
}));

export default function FilledTextFields() {
  const classes = useStyles();
  const [values, setValues] = React.useState({
    name: "Cat in the Hat",
    age: "",
    multiline: "Controlled",
    currency: "EUR"
  });

  // const handleChange = name => event => {
  //   setValues({ ...values, [name]: event.target.value });
  // };

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="h2">
          Create New Validation Check
        </Typography>
      </CardContent>
      <form className={classes.container} noValidate autoComplete="off">
        <TextField
          id="filled-dense"
          label="Name"
          className={clsx(classes.textField, classes.dense)}
          margin="dense"
          variant="filled"
          fullWidth
        />
        <TextField
          id="filled-dense-multiline"
          label="Description"
          className={clsx(classes.textField, classes.dense)}
          margin="dense"
          variant="filled"
          multiline
          fullWidth
          // rowsMax="4"
        />
        <TextField
          id="filled-dense-multiline"
          label="Cypher"
          className={clsx(classes.textField, classes.dense)}
          margin="dense"
          variant="filled"
          multiline
          fullWidth
        />

        <Button variant="contained" className={classes.button}>
          Save
        </Button>
        <Button variant="contained" className={classes.button}>
          Cancel
        </Button>
      </form>
    </Card>
  );
}

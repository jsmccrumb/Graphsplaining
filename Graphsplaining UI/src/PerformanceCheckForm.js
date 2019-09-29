import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
// import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";

import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import graphUtils from "./utils/graph_utils";

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
    name: "",
    severity: 1,
    description: "",
    violationCheck: ""
  });
  const [errors, setErrors] = React.useState({
    name: "",
    severity: "",
    description: "",
    violationCheck: "",
  });
  const violationCheckStart = graphUtils.violationCheckStart;

  const checkError = (field) => {
    let currentError = '';
    const value = values[field];
    if (field === 'severity') {
      if (value == null) {
        currentError = currentError + 'severity is required; ';
      } else if (value < 1) {
        currentError = currentError + 'severity must be >= 1; ';
      } else if (value > 5) {
        currentError = currentError + 'severity must be <= 5; ';
      }
    } else {
      if (!value) {
        currentError = `${currentError}${field} is required; `;
      }
      if (field === 'violationCheck') {
        const checkAlias = /statement|explain|lastPlan/;
        const checkParam = /\$checkName/;
        const checkViolates = /:VIOLATES/;
        if (!checkAlias.test(value)) {
          currentError = currentError + 'violationCheck must use one of alias from the initial match (statement, explain, or lastPlan); ';
        }
        if (!checkParam.test(value)) {
          currentError = currentError + 'violationCheck must use param $checkName to find itself and relate to explain; ';
        }
        if (!checkViolates.test(value)) {
          currentError = currentError + 'violationCheck must relate the check node to explain node with :VIOLATES; ';
        }
        if (currentError = '' && !graphUtils.violationCheckExplains(value)) {
          currentError = currentError + 'violation check must be valid cypher; ';
        }
      }
    }
    setErrors({...errors, [field]: currentError});
  };


  const handleChange = name => event => {
    setValues({ ...values, [name]: event.target.value });
  };

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="h2">
          Create New Validation Check
        </Typography>
      </CardContent>
      <form className={classes.container} noValidate autoComplete="off">
        <TextField
          required
          label="Name"
          className={clsx(classes.textField, classes.dense)}
          margin="dense"
          variant="filled"
          fullWidth
          error={errors.name != ''}
          helperText={errors.name}
          onChange={handleChange('name')}
          onBlur={() => { checkError('name');}}
          value={values.name}
        />
        <TextField
          required
          label="Severity"
          className={clsx(classes.textField, classes.dense)}
          margin="dense"
          variant="filled"
          type="number"
          inputProps={{min: 1, max: 5}}
          error={errors.severity != ''}
          helperText={errors.severity}
          onChange={handleChange('severity')}
          onBlur={() => { checkError('severity');}}
          value={values.severity}
        />
        <TextField
          required
          label="Description"
          className={clsx(classes.textField, classes.dense)}
          margin="dense"
          variant="filled"
          multiline
          fullWidth
          error={errors.description != ''}
          helperText={errors.description}
          onChange={handleChange('description')}
          onBlur={() => { checkError('description');}}
          value={values.description}
        />
        <p title="System will automatically prepend violationCheck with this Cypher">{violationCheckStart}</p>
        <TextField
          required
          label="violationCheck"
          className={clsx(classes.textField, classes.dense)}
          margin="dense"
          variant="filled"
          multiline
          fullWidth
          error={errors.violationCheck != ''}
          helperText={errors.violationCheck}
          onChange={handleChange('violationCheck')}
          onBlur={() => { checkError('violationCheck');}}
          value={values.violationCheck}
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

import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import Tooltip from "@material-ui/core/Tooltip";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    // maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  }
}));

export default function SelectedListItem({checkList = [], selectItem, selectedItem}) {
  const classes = useStyles();
  const [selectedIndex, setSelectedIndex] = React.useState(1);
  if (checkList.length == 0) {
    return ( 
      <Typography variant="h5" component="h3">
        No performance checks found
      </Typography>
    );
  }
  const items = checkList.map((check) => {
    return (
      <Tooltip key={check.name} title={check.description} placement="right">
        <ListItem
          button
          selected={selectedItem === check}
          onClick={event => selectItem(check)}
        >
          <ListItemText primary={check.name} />
        </ListItem>
      </Tooltip>
    );
  });

  return (
    <div className={classes.root}>
      <List component="nav" aria-label="main mailbox folders">
        {items}
      </List>
    </div>
  );
}

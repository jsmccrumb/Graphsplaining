import React, { useState, useEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import SimpleTabs from "./Tabs.js";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  }
}));

export default function ButtonAppBar() {
  const classes = useStyles();
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);
  useEffect(() => {
    if (headerRef) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
    window.temp = headerRef.current;
    console.log(headerRef.current);
  });

  return (
    <div className={classes.root}>
      <AppBar position="fixed" ref={headerRef}>
        <Toolbar>
          <Typography variant="h6" className={classes.title}>
            Graphsplain
          </Typography>
        </Toolbar>
      </AppBar>

      <SimpleTabs headerHeight={headerHeight} />
    </div>
  );
}

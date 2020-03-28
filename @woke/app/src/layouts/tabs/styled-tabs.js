import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import { withStyles } from '@material-ui/core/styles';

export const StyledTabs = withStyles(theme => ({
	root: {
		backgroundColor: theme.palette.background.dark,
		height: theme.spacing(5),
		minHeight: theme.spacing(4),
		maxWidth: 'fit-content',
		// width: 'auto',
		// width: '100%',
		position: 'relative',
		//bottom: 0,
	},

  indicator: {
    display: 'flex',
    justifyContent: 'center',
		backgroundColor: 'transparent',

		// Underline
		'& > div': {
      //maxWidth: 60,
      // width: '100%',
			backgroundColor: theme.palette.primary.main,
    },
  },
}))(props => <Tabs {...props} color="primary" TabIndicatorProps={{ children: <div /> }} />);

export const StyledTab = withStyles(theme => ({
  root: {
    textTransform: 'none',
    color: '#fff',
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.pxToRem(15),
    marginRight: theme.spacing(1),
    '&:focus': {
      opacity: 1,
    },
    '&:hover': {
      color: theme.palette.secondary.main,
    },
  },
}))(props => <Tab disableRipple {...props} />);

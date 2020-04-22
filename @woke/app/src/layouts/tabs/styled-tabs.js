import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import { withStyles } from '@material-ui/core/styles';

export const StyledTabs = withStyles(theme => ({
	root: {
		backgroundColor: theme.palette.background.dark,
		//minHeight: theme.spacing(5),
		minHeight: '5vh',
		maxWidth: 'fit-content',
		position: 'relative',
		[theme.breakpoints.down('sm')]: {
			minHeight: 'fit-content',
			maxWidth: '100%',
			width: '100%',
		},
		//bottom: 0,
	},

  indicator: {
    display: 'flex',
    justifyContent: 'center',
		backgroundColor: 'transparent',

		// Underline
		'& > div': {
      width: '100%',
			backgroundColor: theme.palette.primary.main,
    },
  },
}))(props => <Tabs {...props} color="primary" TabIndicatorProps={{ children: <div /> }} />);

export const StyledTab = withStyles(theme => ({
  root: {
    textTransform: 'none',
    color: '#fff',
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: '1.5rem', // theme.typography.pxToRem(15),
    marginRight: theme.spacing(1),
    '&:focus': {
      opacity: 1,
    },
    '&:hover': {
      color: theme.palette.secondary.main,
    },
  },
}))(props => <Tab {...props} />);

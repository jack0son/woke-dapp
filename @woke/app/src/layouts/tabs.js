import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles, useTheme } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SwipeableViews from 'react-swipeable-views';
import Typography from '@material-ui/core/Typography';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <Typography
			//maxHeight='100%'
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
			{children}
    </Typography>
  );
	//<Box>{children}</Box>
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

const StyledTabs = withStyles(theme => ({
	root: {
		backgroundColor: theme.palette.background.dark,
		height: theme.spacing(5),
		minHeight: theme.spacing(4),
		width: '100%',
		position: 'absolute',
		bottom: 0,
	},

  indicator: {
    display: 'flex',
    justifyContent: 'center',
		backgroundColor: 'transparent',

		// Underline
		'& > div': {
      maxWidth: 60,
      width: '100%',
			backgroundColor: theme.palette.primary.main,
    },
  },
}))(props => <Tabs {...props} color="primary" TabIndicatorProps={{ children: <div /> }} />);

const StyledTab = withStyles(theme => ({
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

const useStyles = makeStyles(theme => ({
  tabsWrapper: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		flexGrow: 0,
		position: 'relative',
		//overflow: 'hidden',
		//backgroundColor: theme.palette.background.dark,
		width: '100%',
		height:'100%',
		maxHeight: '100%',
  },

	swipeableView: {
		//overFlow: 'hidden',
		flexGrow: 0,
	}
}));

export default function CustomTabs (props) {
  const classes = useStyles();
	const theme = useTheme();
  const [value, setValue] = React.useState(0);

  function handleChange(event, newValue) {
    setValue(newValue);
  }

  function handleChangeIndex(index) {
    setValue(index);
  }

  return (
		<div className={classes.tabsWrapper}>
			<SwipeableViews
				className={classes.SwipeableViews}
				axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
				index={value}
				onChangeIndex={handleChangeIndex}
			>
				{ 
					props.children.map((child, i) => (
							<TabPanel key={i} value={value} index={i} dir={theme.direction}>
								{child}
							</TabPanel>
					))
				}

			</SwipeableViews>
			<StyledTabs 
				//style={{height: theme.spacing()}} 
				value={value} 
				onChange={handleChange} 
				aria-label="wallet tabs"
			>
				{ 
					props.children.map((child, i) => (
							<StyledTab key={i} label={child.props.label} />
					))
				}
			</StyledTabs>
		</div>
  );
}
	/*
	 
	 */

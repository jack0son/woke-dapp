import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles, useTheme } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';
import SwipeableViews from 'react-swipeable-views';
import Typography from '@material-ui/core/Typography';

import { StyledTabs, StyledTab } from './styled-tabs';
import TabPanel from './tab-panel';


const useStyles = makeStyles(theme => ({
tabsWrapper: {
		//height: '50%',
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		//justifyContent: 'space-between',
		justifyContent: 'space-between',
		alignSelf: 'stretch',
		height: '100%',
		flexGrow: 1,
		//backgroundColor: theme.palette.background.dark,
  },

	swipeableView: {
		height: '100%',
		// overflow: 'scroll',
		// flexShrink: 1,
	}
}));

export default function PaneTabs(props) {
	const { order, ...innerProps } = props;
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
		<Box className={classes.tabsWrapper} {...innerProps}>
			<SwipeableViews order={0}
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

			<StyledTabs order={1}
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
		</Box>
  );
}
	/*
	 
	 */

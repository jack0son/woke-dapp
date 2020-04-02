import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles, useTheme } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';
import SwipeableViews from 'react-swipeable-views';
import Typography from '@material-ui/core/Typography';

import { StyledTabs, StyledTab } from './styled-tabs';
import TabPanel from './tab-panel';


const useStyles = makeStyles(theme => ({
	tabsWrapper: styles => ({
		width: '85%',
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignSelf: 'stretch',
		//height: '100%',

		marginLeft: 'auto',
		marginRight: 'auto',

		[theme.breakpoints.down('sm')]: {
			marginTop: '10%',
			width: '100%',
		},
		//backgroundColor: theme.palette.background.dark,
		...styles,
	}),

	styledTabs: styles => ({
		height: styles.tabHeight || '5vh',
		[theme.breakpoints.down('sm')]: {
			width: '100%',
		},
	}),

	swipeableView: {
		height: '100%',
		width: 'inherit',
	}
}));

export default function PaneTabs(props) {
	const { order, styles, ...innerProps } = props;
  const classes = useStyles(styles);
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
			<StyledTabs order={0}
				className={classes.styledTabs}
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
			<SwipeableViews order={1}
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
		</Box>
  );
}
	/*
	 
	 */

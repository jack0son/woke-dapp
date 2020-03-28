import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import FlexColumn from './flex-column';


const useStyles = makeStyles(theme => ({
	splitPane: styles => ({
		alignSelf: 'stretch',
		alignItems: 'flex-start',
		justifyContent: 'flex-start',
		// Layout
		/*
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		*/

		// Size
		[theme.breakpoints.down('sm')]: {
		},

		// Spacing

		...styles
	})
}));

export default function FlexRow(props) {
	const {first, second, reverse, styles, ...other} = props;
	const classes = useStyles(styles);

	return (<>
		<FlexColumn flexGrow={1} className={classes.splitPane} styles={styles}>
			{ second }
		</FlexColumn>
		<FlexColumn flexGrow={1} className={classes.splitPane} styles={styles}>
			{ first }
		</FlexColumn>
	</>);
}

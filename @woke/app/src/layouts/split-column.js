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

export default function ColumnSplit(props) {
	const {first, second, reverse, order, styles, ...other} = props;
	const classes = useStyles(styles);

	const _order = order || 2;

	return (<>
		<FlexColumn order={_order} flexGrow={1} className={classes.splitPane} styles={styles}>
			{ first }
		</FlexColumn>
		<FlexColumn order={reverse ? _order - 1 : _order + 1} flexGrow={1} className={classes.splitPane} styles={styles}>
			{ second }
		</FlexColumn>
	</>);
}

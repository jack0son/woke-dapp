import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import FlexColumn from './flex-column';


const useStyles = makeStyles(theme => ({
	splitPane: styles => ({
		// Layout
		alignSelf: 'flex-start',
		alignItems: 'flex-start',
		justifyContent: 'flex-start',

		// Size
		width: '50%',
		maxWidth: '50%',
		[theme.breakpoints.down('sm')]: {
			width: '100%',
			maxWidth: '100%',
		},

		// Spacing

		...styles
	})
}));

export default function SplitColumns(props) {
	const {first, second, reverse, order, styles, ...other} = props;
	const classes = useStyles(styles);

	const _order = order || 2;

	return (<>
		<FlexColumn p={0} order={_order} flexGrow={1} className={classes.splitPane} styles={styles}>
			{ first }
		</FlexColumn>
		<FlexColumn p={0} order={reverse ? _order - 1 : _order + 1} flexGrow={1} className={classes.splitPane} styles={styles}>
			{ second }
		</FlexColumn>
	</>);
}

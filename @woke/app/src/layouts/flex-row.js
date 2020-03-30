import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	flexRow: styles => ({
		// Layout
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',

		// Size
		width: '80%',
		height: '80vh',
		[theme.breakpoints.down('sm')]: {
			width: '95%',
			height: '90vh',
		},

		// Spacing
		marginLeft: 'auto',
		marginRight: 'auto',

		...styles
	})
}));

export default function FlexRow(props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Box
			className={classes.flexRow}
			{...innerProps}
		/>
	);
}

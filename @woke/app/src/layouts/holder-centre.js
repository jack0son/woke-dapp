import React from 'react';
import Box from '@material-ui/core/Box';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	centreHolder: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'center',
		bottom: 0,
		width: 'auto',
		height: 'auto',
		px: theme.spacing(2),
	}
}));

export default function CentreHolder(props) {
	const classes = useStyles();

	return (
		<Box
			className={classes.centreHolder}
			{...props}
		/>
	);
}

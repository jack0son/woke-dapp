import React from 'react';
import Box from '@material-ui/core/Box';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	footer: {
		position: 'absolute',
		width: '100%',
		height: 'auto',
		display: 'flex',
		marginTop: 'auto',
		paddingLeft: '10%',
		paddingRight: '10%',
		paddingBottom: theme.spacing(4),
	}
}));

export default function Footer(props) {
	const classes = useStyles();

	return ( 
		<Box
			className={classes.footer}
			{...props}
		/>
	);
}

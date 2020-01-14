import React from 'react';
import Box from '@material-ui/core/Box';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	: {
	}
}));

export default function Footer(props) {
	const classes = useStyles();

	return (
		<Typography variant="body" align="center" gutterBottom>
			Time to get woke.
		</Typography>
	);
}

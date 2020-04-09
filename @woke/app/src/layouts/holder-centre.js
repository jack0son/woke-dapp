import React from 'react';
import Box from '@material-ui/core/Box';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	centreHolder: styles => ({
		// Layout
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',

		// Size
		height: 'auto',
		width: 'auto',

		// Spacing

		...styles
	})
}));

export default function CentreHolder(props) {
	const { styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Box
			className={classes.centreHolder}
			{...innerProps}
		/>
	);
}

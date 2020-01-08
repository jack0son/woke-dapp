import React from 'react';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	bodyLarge: styles => ({
		position: 'static',
		fontSize: '1rem',
		fontWeight: '700',
		width: '100%',
		maxWidth: '100%',
		...styles
		//px: theme.spacing(3),
	})
}));

export default function LargeBody(props) {
	// MUI Style Overwrite pattern
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Typography
			variant="body1"
			className={classes.bodyLarge}
			{...innerProps}
		gutterBottom/>
	);
}

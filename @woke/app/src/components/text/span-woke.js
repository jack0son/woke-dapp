import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Typography from '@material-ui/core/Typography';


const useStyles = makeStyles(theme => ({
	wokeSpan: styles => ({
		display: 'inline-block',
		fontFamily: 'Nervous',
		fontWeight: 400,
		textAlign: 'left',
		lineHeight: '20px',
		...styles
		//px: theme.spacing(3),
	})
}));

export default function WokeSpan(props) {
	// MUI Style Overwrite pattern
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Typography
			component="span"
			color="secondary"
			className={classes.wokeSpan}
			{...innerProps}
		/>
	);
}

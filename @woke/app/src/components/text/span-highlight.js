import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Typography from '@material-ui/core/Typography';


const useStyles = makeStyles(theme => ({
	highlightSpan: styles => ({
		position: 'static',
		width: '100%',
		maxWidth: '100%',
		...styles
		//px: theme.spacing(3),
	})
}));

export default function HighlightSpan(props) {
	// MUI Style Overwrite pattern
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Typography
			variant="body1"
			component="span"
			color="secondary"
			className={classes.highlightSpan}
			{...innerProps}
		/>
	);
}

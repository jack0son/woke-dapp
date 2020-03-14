import React from 'react';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	bodyStandard: styles => ({
		position: 'static',
		width: '100%',
		maxWidth: '100%',
		textAlign: 'center',
		...styles
		//px: theme.spacing(3),
	})
}));

export default function StandardBody(props) {
	// MUI Style Overwrite pattern
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Typography
			variant="body1"
			className={classes.bodyStandard}
			{...innerProps}
		/>
	);
}

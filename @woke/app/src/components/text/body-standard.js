import React from 'react';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	bodyStandard: styles => ({
		// Layout
		position: 'static',
		textAlign: 'center',
		fontSize: '2rem',

		[theme.breakpoints.down('sm')]: {
			textAlign: 'left',
			fontSize: '1rem',
		},
		// Size
		//width: '100%',
		maxWidth: '100%',
		...styles
	})
}));

export default function StandardBody(props) {
	// MUI Style Overwrite pattern
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Typography
			variant='body1'
			className={classes.bodyStandard}
			{...innerProps}
		/>
	);
}

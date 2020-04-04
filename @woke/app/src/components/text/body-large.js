import React from 'react';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	bodyLarge: styles => {
		const { small, ...other } = styles;

		return ({
			// Layout
			position: 'static',
			textAlign: 'center',

			// Size
			fontSize: '2rem',
			fontWeight: '700',
			//width: '100%',
			//maxWidth: '100%',

			[theme.breakpoints.down('sm')]: {
				fontSize: '1.5rem',
				textAlign: 'left',
				...small,
			},
	
			...other
		});
	}
}));

export default function LargeBody(props) {
	// MUI Style Overwrite pattern
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Typography
			variant='body1'
			className={classes.bodyLarge}
			{...innerProps}
			gutterBottom/>
	);
}

import React from 'react';
import Typography from '@material-ui/core/Typography';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	h2: styles => ({
			// Layout
			position: 'static',
			textAlign: 'center',

			// Size
			fontSize: '3rem',
			fontWeight: '700',
			//width: '100%',
			//maxWidth: '100%',

			[theme.breakpoints.down('sm')]: {
				fontSize: '1rem',
				textAlign: 'left',
				...(styles.small || {}),
			},
	
			...styles
	})
}));

export default function H2(props) {
	const { styles, children, ...other } = props;
	const classes = useStyles(styles);

	return (
		<Typography variant="h2" align="center" gutterBottom>
			{ children }
		</Typography>
	);
}

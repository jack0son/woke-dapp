import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	flexRow: styles => ({
		// Layout
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',

		// Size
		width: '100%',
		height: '80vh',
		[theme.breakpoints.down('sm')]: {
			height: '90vh',
		},

		// Spacing
		paddingRight: theme.spacing(1),
		paddingLeft: theme.spacing(1),
		//marginTop: theme.spacing(2),

		...styles
	})
}));

export default function FlexRow(props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Box
			className={classes.flexRow}
			{...innerProps}
		/>
	);
}

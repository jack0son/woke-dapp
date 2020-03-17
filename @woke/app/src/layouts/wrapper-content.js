import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	contentWrapper: styles => ({
		// Layout
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-around',
		alignItems: 'stretch',

		// Size
		width: '50%',
		[theme.breakpoints.down('sm')]: {
			width: '90%',
		},
		[theme.breakpoints.up('md')]: {
		//	width: '90%',
		},
		//height: '100%',

		// Spacing
		//paddingRight: theme.spacing(2),
		//paddingLeft: theme.spacing(2),
		...styles
	})
}));

export default function ContentWrapper(props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Box
			className={classes.contentWrapper}
			{...innerProps}
		/>
	);
}

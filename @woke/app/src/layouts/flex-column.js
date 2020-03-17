import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	flexColumn: styles => ({
		// Layout
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-evenly',
		alignItems: 'center',

		// Size
		//height:'100%',
		//width: '90%',
		[theme.breakpoints.down('sm')]: {
			//width: '90%',
		},
		[theme.breakpoints.up('md')]: {
		//	width: '90%',
		},
		...styles
	})
}));

export default function FlexColumn(props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Box
			className={classes.flexColumn}
			{...innerProps}
		/>
	);
}

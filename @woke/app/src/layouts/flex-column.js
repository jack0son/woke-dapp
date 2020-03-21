import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	flexColumn: styles => {
		const { small, ...inner } = styles;

		return {
			// Layout
			position: 'relative',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-evenly',
			alignItems: 'center',

			// Size
			height: '70%',
			[theme.breakpoints.down('sm')]: {
				height: '90%',
				alignSelf: 'center', 
				...small,
			},
			[theme.breakpoints.up('md')]: {
			},

			// Spacing
			//marginLeft: 'auto',
			//marginRight: 'auto',

			...inner
		};
	},
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

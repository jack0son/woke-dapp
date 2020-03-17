import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	flexColumn: styles => {
		const { defaultHeight, ...inner } =  styles;

		return {
			// Layout
			position: 'relative',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-evenly',
			alignItems: 'center',

			// Size
			height: defaultHeight || '90%',
			[theme.breakpoints.down('sm')]: {
				height: '90%',
			},
			[theme.breakpoints.up('md')]: {
			},
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

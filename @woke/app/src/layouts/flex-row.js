import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	flexRow: styles => ({
			// Flex child
			flexGrow: 1,
			flexShrink: 1,

			// Layout
			position: 'relative',
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'flex-start',
			//alignContent: 'flex-start',
			flexWrap: 'wrap',

			// Size
			width: '80%',
			[theme.breakpoints.down('sm')]: {
				//marginLeft: '10%',
				//marginRight: '10%',
				width: '100%',
				...(styles.small || {}),
			},

			// Spacing
			marginLeft: 'auto',
			marginRight: 'auto',

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

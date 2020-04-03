import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	flexRow: styles => ({
			// Flex child
			flexGrow: 1,
			flexShrink: 1,
			flexBasis: 'auto',

			// Layout
			position: 'relative',
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			flexWrap: 'wrap',
			//overflow: 'visible',
			//overflowX: 'hidden',
			//overflowY: 'visible',

			// Size
			width: '80%',
			//height: '80vh',
			[theme.breakpoints.down('sm')]: {
				width: '100%',
				...(styles.small || {}),
				//height: 'auto',
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

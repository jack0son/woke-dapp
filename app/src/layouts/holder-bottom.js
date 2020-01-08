import React from 'react';
import Box from '@material-ui/core/Box';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	bottomHolder: styles => ({
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		bottom: 0,
		width: '100%',
		maxHeight: '100%',
		//marginTop: 'auto',
		paddingLeft: theme.spacing(2),
		paddingRight: theme.spacing(2),
		...styles,
	}),
}));

export default function BottomHolder(props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Box
			className={classes.bottomHolder}
			{...props}
		/>
	);
}

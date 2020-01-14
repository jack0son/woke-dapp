import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	contentWrapper: styles => ({
		width: '100%',
		position: 'static',
		display: 'block',
		paddingRight: theme.spacing(2),
		paddingLeft: theme.spacing(2),
		marginTop: theme.spacing(2),
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

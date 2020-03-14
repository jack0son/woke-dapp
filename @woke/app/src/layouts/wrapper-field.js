import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	fieldWrapper: styles => ({
		width: '100%',
		position: 'static',
		display: 'block',
		paddingRight: '10%',
		paddingLeft: '10%',
		paddingTop: theme.spacing(4),
		paddingBottom: theme.spacing(4),
		...styles
	})
}));

export default function FieldWrapper(props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Box
			className={classes.fieldWrapper}
			{...innerProps}
		/>
	);
}

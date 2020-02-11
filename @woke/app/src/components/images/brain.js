import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Link from '@material-ui/core/Link';

const useStyles = makeStyles(theme => ({
	gif: {
		marginTop: theme.spacing(1),
		//height: theme.spacing(5),
		maxWidth: theme.spacing(20),
		height: 'auto',
	},
}));

export default function Brain(props) {

	const src = props.src || 'images/brain-flickering.gif';

	const classes = useStyles();
	return (
		<img 
			position="static" 
			src={src} 
			alt={props.alt} 
			className={classes.gif} 
			style={classes}
			{...props}
		/>
	);
}


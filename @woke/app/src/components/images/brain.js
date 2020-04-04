import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Link from '@material-ui/core/Link';

const useStyles = makeStyles(theme => ({
	gif: {
		maxWidth: '30vh',
		height: 'auto',
		[theme.breakpoints.down('sm')]: {
			maxWidth: '20vh',
			fontSize: '1rem',
		},
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


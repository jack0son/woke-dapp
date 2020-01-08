import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Link from '@material-ui/core/Link';

const useStyles = makeStyles(theme => ({
	logo: {
		marginTop: theme.spacing(1),
		//height: theme.spacing(5),
		maxWidth: theme.spacing(12),
		height: 'auto',
		//animation: '$wink 3s linear infinite, $rotate 4s ease-out infinite',
		animationName: '$fadeInOut, $openClose',
		animationDuration: '4s, 4s',
		animationTimingFunction: 'ease-in, ease-out',
		animationIterationCount: 'infinite',
	},
	'@keyframes fadeInOut': {
		from: {
			opacity: 0,
		},
		'40%': {
			opacity: 1,
		},
		'60%': {
			opacity: 1,
		},
		'75%': {
			opacity: 0,
		},
		to: {
			opacity: 0,
		},
	},

	'@keyframes openClose': {
		from: {
			transform: 'rotateX(85deg)'
		},
		'60%': {
			transform: 'rotateX(0deg)',
			animationTimingFunction: 'ease-in'
		},
		'75%': {
			transform: 'rotateX(85deg)'
		},
		to: {
			transform: 'rotateX(85deg)',
		},
	},
}));

export default function Logo(props) {
	const classes = useStyles();
	return (
		<img 
			position="static" 
			src={props.src} 
			alt={props.alt} 
			className={classes.logo} 
			style={classes}
			{...props}
		/>
	);
}


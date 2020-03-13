import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Link from '@material-ui/core/Link';

const useStyles = makeStyles(theme => ({
  link: {
		height: '100%',
		maxWidth: theme.spacing(10),
		marginLeft: '5%',
		marginRight: theme.spacing(2),
		paddingTop: theme.spacing(1),
		color: 'transparent',
  },

	logo: {
		marginTop: theme.spacing(1),
		//height: theme.spacing(5),
		width: theme.spacing(5),
		[theme.breakpoints.up('sm')]: {
			width: theme.spacing(7.5)
		},
		[theme.breakpoints.up('md')]: {
			width: theme.spacing(10)
		},
		height: 'auto',
		animationName: '$fadeIn, $open',
		animationDuration: '1s, 2s',
		animationTimingFunction: 'ease-in, ease-out',
		animationIterationCount: '1',
	},

	'@keyframes fadeIn': {
		from: {
			opacity: 0,
		},
		to: {
			opacity: 1,
		},
	},

	'@keyframes open': {
		from: {
			transform: 'rotateX(85deg)'
		},
		to: {
			transform: 'rotateX(0deg)',
			animationTimingFunction: 'ease-out'
		},
	},
}));

export default function BrandLink(props) {
	const classes = useStyles();
	return (
			<Link 
				href={props.url} 
				className={classes.link} 
				position="relative" 
				target="_blank"
			>
				<img position="static" src={props.src} alt={props.alt} className={classes.logo}/>
			</Link>
	);
}

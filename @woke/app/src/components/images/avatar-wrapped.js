import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';

const useStyles = makeStyles(theme => ({
  avatarWrapper: {
		//boxSizing: 'box-content !important',
		position: 'relative',
		height: '100%',
		color: 'transparent',
		borderStyle: 'solid',
		borderWidth: '0.25vh',
		borderColor: '#46dc9e',
		borderRadius: '50%',
  },

	avatarImage: {
		//boxSizing: 'box-content !important',
		position: 'relative',
		//width: '100%',
		//width: 'auto',
		height: '100%',
		borderRadius: '50%',
	},
}));

export default function BrandLink (props) {
	const classes = useStyles();
	return (
			<Box
				className={classes.avatarWrapper} 
				position="relative" 
			>
				<img 
					className={classes.avatarImage}
					crossOrigin="anonymous"
					src={props.src} 
					alt={props.alt} 
				/>
			</Box>
	);
}

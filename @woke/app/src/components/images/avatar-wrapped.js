import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import Box from '@material-ui/core/Box';

const useStyles = makeStyles(theme => ({
  avatarWrapper: {
		//boxSizing: 'box-content !important',
		position: 'relative',
		//maxWidth: 76 + theme.spacing(4),
		//maxWidth: '68px',
		//minWidth: '68px',
		height: '100%',
		//marginLeft: theme.spacing(2),
		marginRight: theme.spacing(2),
		color: 'transparent',
		borderStyle: 'solid',
		borderWidth: '2px',
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
					src={props.src} 
					alt={props.alt} 
				/>
			</Box>
	);
}

import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';

import Button from './button-contained'

// TODO Sytle as version of layered button
const useStyles = makeStyles(theme => ({
	tweetButton: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		bottom: 0,
		width: 'auto',
		height: 'auto',
		marginTop: 'auto',
		paddingTop: theme.spacing(2),
		paddingBottom: theme.spacing(2),
	},

	buttonBackground: {
	}
}));

export default function TweetButton (props) {
	const classes = useStyles();
	const theme = useTheme();

	return (
			<Button 
				text="tweet"
				color="secondary"
				{...props}
			/>
	);
}

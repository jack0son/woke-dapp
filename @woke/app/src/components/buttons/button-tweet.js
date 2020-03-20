import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Button from './button-contained'

// TODO Sytle as version of layered button
const useStyles = makeStyles(theme => ({
	tweetButton: {
		//width: '100%',
	},

	buttonBackground: {
	}
}));

export default function TweetButton (props) {
	const classes = useStyles();
	const theme = useTheme();

	return (
			<Button 
				className={classes.tweetButton}
				text="tweet"
				color="secondary"
				//styles={{width: '100%'}}
				{...props}
			/>
	);
}

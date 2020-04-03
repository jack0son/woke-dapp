import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Button from './button-contained';
import TwitterIcon from '@material-ui/icons/Twitter';

// TODO Sytle as version of layered button
const useStyles = makeStyles(theme => ({
	tweetButton: {
		fontSize: '1rem',
		flexGrow: '1',
		marginLeft: '10px',
		marginRight: '10px',
		color: theme.palette.background.dark,
		[theme.breakpoints.up('sm')]: {
			fontSize: '1.25rem',
		}
	},
}));

export default function TweetButton (props) {
	const classes = useStyles();
	const theme = useTheme();

	return (
		<>
			<TwitterIcon />
			<Button 
				className={classes.tweetButton}
				text="tweet"
				color="secondary"
				{...props}
			/>
			<TwitterIcon />
		</>
	);
}

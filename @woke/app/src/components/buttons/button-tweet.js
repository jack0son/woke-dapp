import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Button from './button-contained';
import TwitterIcon from '@material-ui/icons/Twitter';

// TODO Sytle as version of layered button
const useStyles = makeStyles(theme => ({
	tweetButton: {
		fontSize: '1.3rem',
		letterSpacing: '.20rem',
		fontWeight: 700,
		flexGrow: '1',
		marginLeft: '10px',
		marginRight: '10px',
		color: theme.palette.primary.contrastText,
		[theme.breakpoints.up('sm')]: {
			fontSize: '2.2rem',
		}
	},

	tweetIcon: {
		fontSize: '2rem', // icon size
		color: theme.palette.secondary.main,
		[theme.breakpoints.up('sm')]: {
			fontSize: '2rem',
		}
	}
}));

export default function TweetButton (props) {
	const classes = useStyles();
	const theme = useTheme();

	return (
		<>
			<TwitterIcon className={classes.tweetIcon} />
			<Button 
				className={classes.tweetButton}
				text="tweet"
				color="secondary"
				{...props}
			/>
			<TwitterIcon className={classes.tweetIcon} />
		</>
	);
}

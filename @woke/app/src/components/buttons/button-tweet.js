import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Button from './button-contained';
import TwitterIcon from '@material-ui/icons/Twitter';

// TODO Sytle as version of layered button
const useStyles = makeStyles(theme => ({
	tweetButton: styles => ({
		fontSize: '1.3rem',
		letterSpacing: '.20rem',
		textTransform: 'lower', // remove capitalization
		fontWeight: 700,
		flexGrow: '1',
		marginLeft: '10px',
		marginRight: '10px',
		color: theme.palette.primary.contrastText,
		...(styles && styles.small),
		[theme.breakpoints.up('sm')]: {
			fontSize: '2.2rem',
			...(() => {const {small, ...large} = styles; return large;})(),
		}
	}),

	tweetIcon: {
		fontSize: '2rem', // icon size
		color: theme.palette.secondary.main,
		[theme.breakpoints.up('sm')]: {
			fontSize: '2rem',
		}
	}
}));

export default function TweetButton (props) {
	const { memeMode, lowerCase, styles, ...other } = props;
	const classes = useStyles(styles);
	const theme = useTheme();

	return (
		<>
			{ memeMode && <TwitterIcon className={classes.tweetIcon}/> }
			<Button 
				className={classes.tweetButton}
				style={{
					textTransform: lowerCase ? 'lowercase' : 'uppercase',
				}}
				text={'tweet'}
				color="secondary"
				iconLeft={!memeMode && <TwitterIcon/>}
				{...other}
			/>
			{ memeMode && <TwitterIcon className={classes.tweetIcon}/> }
		</>
	);
}

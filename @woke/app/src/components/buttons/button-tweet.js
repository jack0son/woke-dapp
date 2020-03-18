import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Button from './button-contained'

// TODO Sytle as version of layered button
const useStyles = makeStyles(theme => ({
	tweetButton: {
		//position: 'relative',
		//flexDirection: 'column',
		//justifyContent: 'flex-end',
		//alignItems: 'center',
		//width: 'auto',
		//height: 'auto',
		//marginTop: 'auto',
		width: '100%',
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
				//styles={{width: '100%'}}
				{...props}
			/>
	);
}

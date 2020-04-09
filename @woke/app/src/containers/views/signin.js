import React from 'react';
import Typography from '@material-ui/core/Typography';
import FlexColumn from '../../layouts/flex-column';
import ButtonGroup from '../../layouts/button-group';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	title: {
			fontSize: '8rem',
			lineHeight: '8.5rem',
		[theme.breakpoints.down('sm')]: {
			fontSize: '4rem',
			lineHeight: '4.5rem',
			marginBottom: '20%',
		},
	}
}));

export default function SigninView(props) {
	const classes = useStyles();

	return (<>
		<FlexColumn styles={{
			alignSelf: 'center',
			marginBottom: '10%',
			small: {
				alignSelf: 'flex-start',
				marginTop: '18%',
			},
			justifyContent: 'space-evenly'
		}}>
			<Typography variant="h1" className={classes.title} align="center" gutterBottom>
				WOKE NETWORK
			</Typography>

			<Typography variant="h4" align="center" gutterBottom>
				Share social impact.
			</Typography>
			<ButtonGroup reverse
				message='Sign in with twitter to claim your join bonus and spread the wokeness.'
				buttonProps={{
					onClick: props.triggerSignIn,
					text: 'sign in',
					color: 'primary'
				}}
			/>
		</FlexColumn>
	</>);
}

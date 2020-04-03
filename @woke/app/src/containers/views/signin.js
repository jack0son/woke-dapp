import React from 'react';
import Typography from '@material-ui/core/Typography';
import FlexColumn from '../../layouts/flex-column';
import ButtonGroup from '../../layouts/button-group';

export default function SigninView(props) {

	return (<>
		<FlexColumn styles={{
			alignSelf: 'center',
			marginBottom: '10%',
			small: {
			},
			justifyContent: 'space-evenly'
		}}>
			<Typography variant="h1" align="center" gutterBottom>
				WOKE NETWORK
			</Typography>

			<Typography variant="h4" align="center" gutterBottom>
				Share social impact.
			</Typography>
			<ButtonGroup
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

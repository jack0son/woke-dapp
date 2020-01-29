import React from 'react';
import Typography from '@material-ui/core/Typography';

import ContentWrapper from '../../layouts/wrapper-content';
import Footer from '../../layouts/footer';
import BottomHolder from '../../layouts/holder-bottom';
import ButtonGroup from '../../layouts/button-group';


export default function SigninView(props) {
	return (
		<>
		<ContentWrapper
			styles={{marginTop: '10%'}}
		>
			<Typography variant="h1" align="center" gutterBottom>
				WOKE NETWORK
      </Typography>

			<Typography variant="h4" align="center" gutterBottom>
				Share social impact.
      </Typography>
		</ContentWrapper>

		<Footer>
			<BottomHolder>
				<ButtonGroup
					message='Sign in with twitter to claim your join bonus and spread the wokeness.'
					buttonProps={{
						onClick: props.triggerSignIn,
						text: 'sign in',
						color: 'primary'
					}}
				/>
			</BottomHolder>
		</Footer>
		</>
	);
}

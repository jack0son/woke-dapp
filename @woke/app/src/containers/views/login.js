import React from 'react';
import OnboardingContainer from '../../layouts/container-onboarding';
import EnterPassword from '../../components/forms/password-enter';
import StandardBody from '../../components/text/body-standard';
import XLBody from '../../components/text/body-xl';
import RememberPasswordText from '../../components/text/remember-password';


export default function LoginView(props) {
	return (<>
		<OnboardingContainer styles={{
		}}>
			<XLBody styles={{textAlign: 'center', marginTop: '10%'}}>
				Login
			</XLBody>
			<StandardBody
				color='secondary'
			>
			</StandardBody>

			<EnterPassword
				errorMessage={props.errorMessage}
				triggerLogin={props.handleLogin}
				buttonProps={{
					text: 'login',
					color: 'primary'
				}}
			/>
			<RememberPasswordText/>
		</OnboardingContainer>
	</>);
}

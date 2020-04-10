import React from 'react';
import OnboardingContainer from '../../layouts/container-onboarding';
import NewPassword from '../../components/forms/password-new';
import StandardBody from '../../components/text/body-standard';
import XLBody from '../../components/text/body-xl';
import RememberPasswordText from '../../components/text/remember-password';



export default function SetPasswordView(props) {
	return (
		<>
			<OnboardingContainer styles={{
			}}>
				<div>
					<XLBody>
						Set your password
					</XLBody>
					<StandardBody color='secondary'>
						We suggest a memorable sentence.
					</StandardBody>
				</div>

				<NewPassword
					triggerSetPassword={props.triggerSetPassword}
					errorMessage={props.errorMessage}
					//flexGrow={4}
					buttonProps={{
						text: 'confirm',
						color: 'primary'
					}}
				/>

			<RememberPasswordText/>
			</OnboardingContainer>
		</>
	);
}

import React from 'react';
import Typography from '@material-ui/core/Typography';

import FlexRow from '../../layouts/flex-row';
import FlexColumn from '../../layouts/flex-column';
import OnboardingContainer from '../../layouts/container-onboarding';
import Footer from '../../layouts/footer';
import BottomHolder from '../../layouts/holder-bottom';
import ButtonGroup from '../../layouts/button-group';

import NewPassword from '../../components/forms/password-new'
import StandardBody from '../../components/text/body-standard'
import LargeBody from '../../components/text/body-large'
import RememberPasswordText from '../../components/text/remember-password'

import WokeSpan from '../../components/text/span-woke'


export default function SetPasswordView(props) {
	return (
		<>
			<OnboardingContainer styles={{
			}}>
				<div>
					<LargeBody>
						Set your password
					</LargeBody>
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

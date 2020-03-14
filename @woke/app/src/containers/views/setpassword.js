import React from 'react';
import Typography from '@material-ui/core/Typography';

import ContentWrapper from '../../layouts/wrapper-content';
import Footer from '../../layouts/footer';
import BottomHolder from '../../layouts/holder-bottom';
import ButtonGroup from '../../layouts/button-group';

import NewPassword from '../../components/forms/password-new'
import StandardBody from '../../components/text/body-standard'
import LargeBody from '../../components/text/body-large'
import HL from '../../components/text/span-highlight'
import WokeSpan from '../../components/text/span-woke'


export default function SetPasswordView(props) {
	return (
		<>
		<ContentWrapper height='55vh'>
			<LargeBody>
				Set your woke wallet password
			</LargeBody>
			<StandardBody color='secondary'>
				We suggest a memorable sentence.
			</StandardBody>

			<NewPassword
				triggerSetPassword={props.triggerSetPassword}
				errorMessage={props.errorMessage}
				buttonProps={{
					text: 'confirm',
					color: 'primary'
				}}
			/>
		</ContentWrapper>

		<Footer>
			<BottomHolder>
				<StandardBody>
					Your password can <HL>never</HL> be recovered.
					<br/><br/>
					Remember your password. Stay woke.
				</StandardBody>
			</BottomHolder>
		</Footer>
		</>
	);
}

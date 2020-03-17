import React from 'react';
import Typography from '@material-ui/core/Typography';

import ContentWrapper from '../../layouts/flex-column';
import Footer from '../../layouts/footer';
import BottomHolder from '../../layouts/holder-bottom';
import ButtonGroup from '../../layouts/button-group';

import EnterPassword from '../../components/forms/password-enter'
import StandardBody from '../../components/text/body-standard'
import LargeBody from '../../components/text/body-large'
import HL from '../../components/text/span-highlight'


export default function LoginView(props) {
	return (
		<>
		<ContentWrapper height='45vh'>
			<LargeBody styles={{textAlign: 'center'}}>
			</LargeBody>
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

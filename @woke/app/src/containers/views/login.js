import React from 'react';
import Typography from '@material-ui/core/Typography';

import FlexColumn from '../../layouts/flex-column';
import Footer from '../../layouts/footer';
import BottomHolder from '../../layouts/holder-bottom';
import ButtonGroup from '../../layouts/button-group';

import EnterPassword from '../../components/forms/password-enter'
import StandardBody from '../../components/text/body-standard'
import LargeBody from '../../components/text/body-large'
import HL from '../../components/text/span-highlight'


export default function LoginView(props) {
	return (<>
		<FlexColumn styles={{
			justifyContent: 'space-around',
			height: '60% !important',
			small: {
				justifyContent: 'space-between',
				alignSelf: 'center',
				//height: '50%',
			},
		}}>
			<LargeBody styles={{textAlign: 'center', marginTop: '10%'}}>
				Login
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

			<StandardBody styles={{marginBottom: '10%', marginTop: '10%'}}>
				Your password can <HL>never</HL> be recovered.
				<br/><br/>
				Remember your password. Stay woke.
			</StandardBody>
		</FlexColumn>
	</>);
}

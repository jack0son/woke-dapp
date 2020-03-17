import React from 'react';
import Typography from '@material-ui/core/Typography';

import FlexRow from '../../layouts/flex-row';
import FlexColumn from '../../layouts/flex-column';
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
			<FlexRow styles={{}}>
				<FlexColumn styles={{
					//width: '40%',
					//justifyContent: 'space-around',
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

					<StandardBody styles={{textAlign: 'center'}}>
						Your password can <HL>never</HL> be recovered.
						<br/>
						Remember your password. Stay woke.
					</StandardBody>
				</FlexColumn>
			</FlexRow>
		</>
	);
}

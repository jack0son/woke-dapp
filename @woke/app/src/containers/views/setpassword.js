import React from 'react';
import Typography from '@material-ui/core/Typography';

import ContentContainer from '../../layouts/container-content';
import ContentWrapper from '../../layouts/wrapper-content';
import Footer from '../../layouts/footer';
import BottomHolder from '../../layouts/holder-bottom';
import ButtonGroup from '../../layouts/button-group';

import NewPassword from '../../components/forms/password-new'
import StandardBody from '../../components/text/body-standard'
import LargeBody from '../../components/text/body-large'
import HL from '../../components/text/span-highlight'
import WokeSpan from '../../components/text/span-woke'

const noGrow = 1;
export default function SetPasswordView(props) {
	return (
		<>
			<ContentContainer styles={{}}>
				<ContentWrapper styles={{
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
				</ContentWrapper>
			</ContentContainer>
		</>
	);
}

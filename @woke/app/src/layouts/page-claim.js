import React from 'react';
import { makeStyles } from '@material-ui/styles';
import OnboardingContainer from './container-onboarding';
import BelowButtonGroup from './button-group-below';
import BodyLarge from '../components/text/body-large';

const useStyles = makeStyles(theme => ({
	buttons: styles => ({
		display: 'flex',
		justifyContent: 'space-between',
		width: '40vh',
		flexWrap: 'wrap',
	}),
}));


export default function ClaimPage(props) {
	const classes = useStyles(props.styles);

	return (
		<>
			<OnboardingContainer styles={{
				width: '70%',
				small: {
					height: '80vh',
					width: '85%',
					marginLeft: 'auto',
					marginRight: 'auto',
				}
			}}>
				<BodyLarge
					styles={{
						textAlign: 'justify',
						paddingLeft: '10%',
						paddingRight: '10%',
						small: {
							paddingLeft: '0%',
							paddingRight: '0%',
						},
					}}
				>
					<props.InstructionText/>
				</BodyLarge>
				<div className={classes.buttons}>
					<BelowButtonGroup
						message={props.buttonMessage}
						messageColor={props.messageColor}
						Button={props.Button}
						buttonProps={props.buttonProps}
						flexContainerProps={props.flexContainerProps}
					/>
					{props.children}
				</div>
			</OnboardingContainer>
		</>
	);
}

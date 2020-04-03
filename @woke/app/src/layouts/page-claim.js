import React from 'react';
import { useTheme, makeStyles } from '@material-ui/styles';

import FlexColumn from './flex-column';
import OnboardingContainer from './container-onboarding';
import BelowButtonGroup from './button-group-below';

import BodyLarge from '../components/text/body-large'
import HL from '../components/text/span-highlight'

const useStyles = makeStyles(theme => ({
	buttons: styles => ({
		//paddingLeft: '30%',
		//paddingRight: '30%',
		layout: 'flex',
		justifyContent: 'space-between',
		alignItems: 'stretch',
		width: '30vh',
	}),
}));


export default function ClaimPage(props) {
	const classes = useStyles(props.styles);

	return (
		<>
			<OnboardingContainer styles={{
				small: {
					width: '80%',
					marginLeft: 'auto',
					marginRight: 'auto',
				}
			}}>
				<BodyLarge
					styles={{
						paddingLeft: '0%',
						paddingRight: '0%',
						textAlign: props.textAlign || 'justify',
					}}
				>
					{props.instructionText}
				</BodyLarge>
				<div className={classes.buttons}>
					<BelowButtonGroup
						message={props.buttonMessage}
						Button={props.Button}
						buttonProps={props.buttonProps}
					/>
					{props.children}
				</div>
			</OnboardingContainer>
		</>
	);
}

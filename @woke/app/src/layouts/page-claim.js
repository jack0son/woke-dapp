import React from 'react';
import { useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';

import ContentWrapper from './wrapper-content';
import Footer from './footer';
import BottomHolder from './holder-bottom';
import BelowButtonGroup from './button-group-below';

import BodyStandard from '../components/text/body-standard'
import BodyLarge from '../components/text/body-large'
import HL from '../components/text/span-highlight'


export default function ClaimsProcess(props) {
	const theme = useTheme();

	return (
		<>
		<ContentWrapper
			styles={{marginTop: '20%'}}
		>
			<BodyLarge
				styles={{
					textAlign: props.textAlign ? props.textAlign : 'justify',
					paddingLeft: theme.spacing(2),
					paddingRight: theme.spacing(2),
				}}
			>
				{props.instructionText}
			</BodyLarge>

		</ContentWrapper>

		<Footer minHeight='50% !important'>
			<BottomHolder justifyContent='flex-start !important'>
				<BelowButtonGroup
					message={props.buttonMessage}
					Button={props.button}
					buttonProps={props.buttonProps}
					//styles={{marginTop: ''}}
				/>
				{props.children}
			</BottomHolder>
		</Footer>
		</>
	);
}

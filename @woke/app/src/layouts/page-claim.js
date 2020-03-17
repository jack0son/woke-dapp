import React from 'react';
import { useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';

import FlexColumn from './flex-column';
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
			<FlexColumn styles={{
				height: '30%',
				smallHeight: '30%',
				justifyContent: 'space-evenly',
				alignItems: 'stretch',
				//alignContent: 'space-between',
			}}>
				<BodyLarge
				styles={{
					//textAlign: props.textAlign ? props.textAlign : 'justify',
				}}
			>
				{props.instructionText}
			</BodyLarge>
			<BelowButtonGroup
				message={props.buttonMessage}
				Button={props.button}
				buttonProps={props.buttonProps}
			/>
			{props.children}
		</FlexColumn>
		</>
	);
}

import React from 'react';
import { useTheme, makeStyles } from '@material-ui/styles';

import FlexColumn from './flex-column';
import BelowButtonGroup from './button-group-below';

import BodyLarge from '../components/text/body-large'
import HL from '../components/text/span-highlight'

const useStyles = makeStyles(theme => ({
	buttons: styles => ({
		display: 'flex',
		justifyContent: 'space-between',
		width: '30vh',
		flexWrap: 'wrap',
	}),
}));


export default function ClaimPage(props) {
	const classes = useStyles(props.styles);

	return (
		<>
			<FlexColumn styles={{
				height: '50% !important',
				smallHeight: '60%',
				justifyContent: 'space-evenly',
				alignItems: 'center',
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
						flexContainerProps={props.flexContainerProps}
					/>
					{props.children}
				</div>
			</FlexColumn>
		</>
	);
}

import React from 'react';
import { useTheme } from '@material-ui/styles';

import StandardBody from './body-standard';
import WokeSpan from './span-woke';

const fontSizeRem = 1.8;

export default function TransactionAmount(props) {
	const theme = useTheme();
	let {amount, type, ...innerProps} = props;

	let symbol, style;

	switch(type) {
		case 'receive': {
			symbol = '+';
			style = {color: theme.palette.accents.secondary.main};
			break;
		}
		default: {
			type = 'send'
			symbol = '-';
			style = {color: theme.palette.primary.main};
		}
	}

	let styles = {
		fontSize: `${fontSizeRem}rem`,
		lineHeight: `${fontSizeRem}rem`,
		...style
	};

	return (
		<>
		<StandardBody noWrap styles={styles}>
			{symbol}{amount} <WokeSpan styles={{fontSize: `${fontSizeRem*0.8}rem`}}>W</WokeSpan>
		</StandardBody>
			
		</>
	);
}

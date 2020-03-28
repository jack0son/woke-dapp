import React from 'react';
import { useTheme } from '@material-ui/styles';

import StandardBody from './body-standard';
import WokeSpan from './span-woke';

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
		fontSize: '1.5rem' || '16px',
		lineHeight: '20px',
		...style
	};

	return (
		<>
		<StandardBody noWrap styles={styles}>
			{symbol}{amount} <WokeSpan styles={{fontSize: '12px'}}>W</WokeSpan>
		</StandardBody>
			
		</>
	);
}

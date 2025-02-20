import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import FlexColumn from './flex-column';

export default function OnboardingContainer(props) {
	const { styles, ...other } = props;
	const { small, ..._styles } = styles;

	return <FlexColumn
		styles={{
			height: '80vh',
			alignSelf: 'flex-start',
			//justifyContent: 'space-around',

			small: {
				height: '90vh',
				alignSelf: 'flex-start',
				...(styles.small || {}),
				//justifyContent: 'space-between',
			},
			..._styles,
		}}
		{ ...other }
	/>
}


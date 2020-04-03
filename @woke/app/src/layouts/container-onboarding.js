import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import FlexColumn from './flex-column';

export default function OnboardingContainer(props) {
	const { styles, ...other } = props;

	return <FlexColumn
		styles={{
			height: '70vh',
			alignSelf: 'flex-start',

			small: {
				height: '80vh',
				alignSelf: 'flex-start',
			}
		}}
		{ ...other }
	/>
}


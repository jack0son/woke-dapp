import React from 'react';
import { makeStyles } from '@material-ui/styles';

import StandardBody from './body-standard';


const useStyles = makeStyles(theme => ({
	highlightSpan: styles => ({
		position: 'static',
		width: '100%',
		maxWidth: '100%',
		...styles
		//px: theme.spacing(3),
	})
}));

export default function HighlightSpan(props) {
	// MUI Style Overwrite pattern
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<StandardBody
			component="span"
			color="secondary"
			{...innerProps}
		/>
	);
}

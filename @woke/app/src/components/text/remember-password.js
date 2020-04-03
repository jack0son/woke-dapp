import React from 'react';
import StandardBody from './body-standard';
import HL from './span-highlight';

import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(theme => ({
	bodyStandard: styles => ({
		[theme.breakpoints.down('sm')]: {
		},
	})
}));

export default function RememberPasswordText(props) {
	// MUI Style Overwrite pattern
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<StandardBody styles={{textAlign: 'justify', marginBottom: '10%', marginTop: '10%'}}>
			Your password can <HL>never</HL> be recovered.
			<br/>
			Remember your password. Stay woke.
		</StandardBody>
	);
}

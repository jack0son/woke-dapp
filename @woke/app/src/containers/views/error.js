import React from 'react';
import { makeStyles } from '@material-ui/styles';

import FlexColumn from '../../layouts/flex-column';
import LargeBody from '../../components/text/body-large';
import H2 from '../../components/text/h2';
import Brain from '../../components/images/brain';

// View hooks
// @TODO views should not contain app state
import { useRootContext } from '../../hooks/root-context'

const useStyles = makeStyles(theme => ({
	brain: {
		//minWidth: '100%',
		height: '30vh',
	}
}));

export default function ErrorView(props) {
	const {setLoading} = useRootContext();
	const classes = useStyles();

	return (
		<FlexColumn styles={{
			justifyContent: 'space-around',
			alignItems: 'center',
			small: { width: '85%' },
		}}>
			{ props.children ? props.children : (
				<H2>F&!K</H2>
			)}
			<div className={classes.brain}>
				<Brain/>
			</div>
			<LargeBody color="error" styles={{small: {
				fontSize: '1.2rem',
				textAlign: 'center',
			}}}>
				{props.message}
			</LargeBody>
		</FlexColumn>
	);
}

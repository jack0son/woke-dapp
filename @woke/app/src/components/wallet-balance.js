
import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import LargeBody from './text/body-large';
import WokeSpan from './text/span-woke';

const balanceSizeREM = 8;
const useStyles = makeStyles(theme => ({
	label: {
		display: 'inline-block',
		textAlign: 'left',
		marginBottom: '15%',
	},

	amount: styles => ({
		// Typography 
		fontSize: '2rem',
		fontWeight: '700',

		maxWidth: '100%',
		//marginTop: '5%',
		marginBottom: '5%',
		fontSize: `${balanceSizeREM}rem`,
		position: 'static',
		textAlign: 'center',

		// Size
		width: '100%',
		maxWidth: '100%',

		//[theme.breakpoints.down('sm')]: {
		//	...small,
		//},

		//...other
	})
}));

export default function WalletBalance({ balance }, props) {
	const { styles, ...other } = props;
	const classes = useStyles(styles);

	return (<>
		<Typography variant="h3"align="center" order={3} className={classes.amount}>
			<LargeBody alignSelf='flex-start' color='secondary' className={classes.label} styles={{
				small: {
					textAlign: 'center',
				}
			}}> 
			</LargeBody>
			{balance}<WokeSpan styles={{fontSize: `${balanceSizeREM*0.7}rem`}}> W</WokeSpan>
		</Typography>
	</>);
}

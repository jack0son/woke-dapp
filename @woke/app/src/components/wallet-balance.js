
import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import LargeBody from './text/body-large';
import WokeSpan from './text/span-woke';

const balanceSizeREM = 8;
const balanceSizeSmallREM = 6;
const useStyles = makeStyles(theme => ({
	amount: styles => ({
		// Typography 
		fontSize: `${balanceSizeREM}rem`,
		lineHeight: `${balanceSizeREM}rem`,
		display: 'inline',
		//textAlign: 'center',

		paddingLeft: 0,
		paddingRight: 0,
		marginBottom: '5%',
		// Size
		//width: '100%',
		maxWidth: '100%',

		[theme.breakpoints.down('sm')]: {
			fontSize: `${balanceSizeSmallREM}rem`,
			lineHeight: `${balanceSizeSmallREM}rem`,
		},
	}),
}));

export default function WalletBalance({ balance, ...props }) {
	const { styles, ...other } = props;
	const classes = useStyles(styles);

	const ratio = 0.7;
	const wokeSize = balanceSizeREM*ratio;
	const wokeSizeSmall = balanceSizeSmallREM*ratio;

	return (<>
		<Typography variant="h3" align="center" order={3} className={classes.amount}>
			<LargeBody align='center' color='secondary' styles={{
				fontWeight: '400',
				fontSize: '1.5rem',
				//marginBottom: '15%',
				textAlign: 'left',
				small: {
					fontSize: '0.8rem',
					textAlign: 'left',
				}
			}}>Balance</LargeBody>
			{balance} <WokeSpan styles={{
				fontSize: `${wokeSize}rem`,
				lineHeight: `${wokeSize}rem`,
				small: {
					fontSize: `${wokeSizeSmall}rem`,
					lineHeight: `${wokeSizeSmall}rem`
				}
			}}>W</WokeSpan>
		</Typography>
	</>);
}

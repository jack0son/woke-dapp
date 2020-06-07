import React from 'react';

import FlexRow from '../../layouts/flex-row';
import WokeSpan from '../text/span-woke';
import LargeBody from '../text/body-large';
import StandardBody from '../text/body-standard';

// Tweet buttton
import TweetButton from '../buttons/button-tweet';
import { Share } from 'react-twitter-widgets';  // NB: necessary import
import { createShareIntentUrl } from '../../lib/utils';

export default function Tutorial(props) {
	const { choice, amount } = props;

	const wokeSpanStyles = {
		whiteSpace: 'nowrap',
		fontSize: `${2*0.7}rem`,
		linHeight: `${2*0.7}rem`,
	};

	const hlStyles = {
		fontWeight: `400`,
		fontSize: `${1.5}rem`,
		small: {
			fontSize: `${1.2}rem`,
			fontWeight: `400`,
		}
	};

	const lbStyles = {
		textAlign: 'justify',
		fontSize: `${2*0.7}rem`,
		linHeight: `${2*0.7}rem`,
		fontWeight: '400',
		marginTop: '8%',
		marginBottom: '5%',
		paddingLeft: '15%',
		paddingRight: '15%',
		small: {
			paddingLeft: '10%',
			paddingRight: '8%',
			fontSize: `${1.2}rem`,
			linHeight: `${1.2}rem`,
		}
	};

	const tipStr = `${'%2B'}${amount || 3} $WOKE`;

	const choose = () => {
		switch(choice) {
			case 'transfers':
				return (<>
					<LargeBody styles={lbStyles}>
						Send <WokeSpan styles={wokeSpanStyles}>WOKENs</WokeSpan> from twitter by replying <LargeBody styles={hlStyles} component='span' color='secondary'>
							+10&nbsp;$WOKE</LargeBody> to a tweet.<br/><br/>
					</LargeBody>

					<FlexRow styles={{justifyContent: 'space-evenly', alignItems: 'center'}}>
						<TweetButton lowerCase
							href={createShareIntentUrl(`@KimKardashian Have some wokens Kimmy!\n ${tipStr} 💖💖💖\n%23WakeUpKimmy`, true)}
							styles={{
								flexGrow: '0',
								fontSize: '1rem',
								small: {
									flexGrow: '0',
									fontSize: '1rem',
								},
							}}/>
						<StandardBody styles={{fontWeight: '700', fontSize: '1.5rem'}} component='span' color='primary'>
							try it out!
						</StandardBody>
					</FlexRow>
					<LargeBody styles={lbStyles}>
						<br/>You can send as many wokens as you like, just change the amount in the tweet.
					</LargeBody>
				</>);
			case 'rewards': 
			default:
				return (<>
					<LargeBody styles={lbStyles}>
						Send <WokeSpan styles={wokeSpanStyles}>WOKENs</WokeSpan> from twitter by replying <LargeBody styles={hlStyles} component='span' color='secondary'>
							Tribute <WokeSpan>WOKENs</WokeSpan> to new users to earn an elightenment bonus when they join.</LargeBody>
					</LargeBody>
				</>);
		}
	}

	return choose();
}

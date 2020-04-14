import React from 'react';

import FlexRow from '../../layouts/flex-row';
import WokeSpan from '../text/span-woke';
import LargeBody from '../text/body-large';
import StandardBody from '../text/body-standard';
import TweetButton from '../buttons/button-tweet';

import { createShareIntentUrl } from '../../lib/utils';

export default function Tutorial(props) {
	const { choice, amount } = props;

	const wokeSpanStyles = {
		fontSize: `${2*0.7}rem`,
		linHeight: `${2*0.7}rem`,
	}

	const hlStyles = {
		small: {
			fontSize: `${1.2}rem`,
			fontWeight: `400`,
		}
	}

	const choose = () => {
		switch(choice) {
			case 'transfers':
				return (<>
					Send <WokeSpan styles={wokeSpanStyles}>WOKENs</WokeSpan> from twitter by replying to a tweet with <LargeBody styles={hlStyles} component='span' color='secondary'>
						+10 $WOKE</LargeBody>.<br/><br/>

					<FlexRow styles={{justifyContent: 'space-evenly', alignItems: 'center'}}>
						<TweetButton lower 
							href={createShareIntentUrl(`+${amount || 3} $WOKE Have some wokens Kimmy!\n@KimKardashian`)}
							styles={{
								flexGrow: '0',
								fontSize: '1rem',
								small: { flexGrow: '0' },
							}}/>
						<StandardBody styles={{fontSize: '1.5rem'}} component='span' color='primary'>
							try it out!
						</StandardBody>
					</FlexRow>
					<br/>You can send as many wokens as you like, just change the amount in the tweet.
				</>);
			case 'rewards': 
				return (<>
					Tribute <WokeSpan>WOKENs</WokeSpan> to new users to earn an elightenment bonus when they join.
				</>);
		}
	}

	return (
		<LargeBody
			styles={{
				textAlign: 'justify',
				fontSize: `${2*0.7}rem`,
				linHeight: `${2*0.7}rem`,
				marginTop: '8%',
				marginBottom: '5%',
				paddingLeft: '10%',
				paddingRight: '5%',
				small: {
					fontSize: `${1.2}rem`,
					linHeight: `${1.2}rem`,
				}
			}}
		> 
			{ choose() }
		</LargeBody>
	);
}

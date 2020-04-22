import React from 'react';
import Typography from '@material-ui/core/Typography';
import BodyStandard from '../../components/text/body-standard';
import BodyLarge from '../../components/text/body-large';
import FlexRow from '../flex-row';
import FlexCol from '../flex-column';

//Placeholder how page layout

const styles = {
	large: {
		width: '100%',
		position: 'relative',
		alignSelf: 'left',
		color: 'secondary',
		textAlign: 'left',
		small: {
			textAlign: 'left',
		}
	},
	standard: {
		fontSize: '1.5rem',
		textAlign: 'left',
		fontWeight: '400',
		small: {
			fontWeight: '400',
			textAlign: 'left',
		}
	},
}

const BS = (props) => <BodyStandard styles={styles.standard} {...props}/>;
const BL = (props) => <BodyLarge color='secondary' styles={styles.large} {...props}/>;

const SHL = (props) => BS({ component: 'span', color: 'primary', ...props});

export default function How () {

	return (
		<FlexCol styles={{
			width: '60%',
		}}>
			<BL>
				Who can receive wokens?
			</BL>
			<BS>
				<SHL>Anyone</SHL>, on twitter. Use their <SHL color='secondary'>twitter handle</SHL> in the app, or reply to one of their tweets with <SHL>+5 $WOKE</SHL>.
			<br/><br/>
				Once someone joins Woke Network, they will have access to all wokens they have ever been tributed.
			<br/><br/>
			</BS>
			<BL>
				How do I get more wokens?
			</BL>
			<BS>
				New wokens are <SHL>summoned</SHL> when new users join. When they join, Woke members who sent them wokens will receive a portion of the summoned wokens.

			<br/><br/>
			</BS>
			<BL>
				Why would I share my wokens?
			</BL>
			<BS>
				The Woke Network is a <SHL>social game</SHL> for rewarding woke content on twitter. In the coming beta, wokens will be used to give users more <SHL color='primary'>power over their social feed</SHL>.
				<ul>
					<li>Pooled by a community to power-up tweets</li>
					<li>Sacrificed to your tweets to encourage engagement</li>
					<li>Exchanged for unique digital items</li>
				</ul>
			<br/>
			</BS>
			<BL>
				Why do I need to tweet a weird message to join?
			</BL>
			<BS>
				The proof tweet contains a cryptographically signed message which uniquely links your twitter account to your new Woke Wallet. Using a public tweet allows your account ownership to be verified by a <SHL>decentralised server network</SHL> without the central control of the Woke Network developers.
			<br/><br/>
			</BS>
			<BL>
			</BL>
			<BS>
			<br/><br/>
			</BS>
		</FlexCol>
	);
}

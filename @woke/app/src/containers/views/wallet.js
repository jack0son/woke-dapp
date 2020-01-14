import React from 'react';
import { makeStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';

import Footer from '../../layouts/footer';
import BottomHolder from '../../layouts/holder-bottom';
import Tabs from '../../layouts/tabs';
import TransactionList from '../../layouts/list-transactions';
import ContentWrapper from '../../layouts/wrapper-content'

import AvatarHeader from '../../components/header-avatar';
import WokeSpan from '../../components/text/span-woke';
import SendTransferForm from  '../../components/forms/send-transfer'
import LargeBody from '../../components/text/body-large';

const useStyles = makeStyles(theme => ({
	bottomHolder: styles => ({
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		bottom: 0,
		width: '100%',
		height: 'auto',
		//marginTop: 'auto',
		paddingLeft: theme.spacing(2),
		paddingRight: theme.spacing(2),
		...styles,
	}),

	balanceText: {
		fontSize: '38px',
		lineHeight: '40px',
		fontWeight: 700,
	}
}));

export default function WalletView (props) {
	// TODO pass sendTransfer as prop
	const {
		styles,
		user,
		userData,
		friends,
		balance,
		transferEvents,
		rewardEvents,
		sendTransfers,
	} = props;
	const classes = useStyles(styles);

	friends.forEach(user => {
		user.label = user.screen_name;
		user.handle = user.screen_name;
		user.avatar = user.profile_image_url;
	});

	// Choose largest image as per https://developer.twitter.com/en/docs/accounts-and-users/user-profile-images-and-banners.html
	let avatar = props.user.avatar;
	const imageModifier = '_normal.jpg'
	if(avatar.endsWith(imageModifier)) {
		avatar = avatar.slice(0, avatar.length - imageModifier.length) + '.jpg';
	}

	return (
		<>
		<AvatarHeader
			src={avatar}
			handle={props.user.handle}
		/>

		<Typography variant="h3" fontSize='38px' align="center">
			{balance}<WokeSpan styles={{fontSize: '30px'}}> W</WokeSpan>
		</Typography>

		<SendTransferForm
			sendTransfers={sendTransfers}
			pending={sendTransfers.pending}
			usernamePlaceholder='username...'
			amountPlaceholder='amount'
			suggestions={friends}
		/>

		<Footer minHeight='40% !important' height='40% !important'>
			<BottomHolder
				styles={{
					height: '100%',
					position: 'absolute',
					bottom: 0,
					paddingLeft: 0,
					paddingRight: 0,
				}}
			>
				<Tabs>
					<TransactionList
						label="Transfers"
						listItems={transferEvents}
					/>
					<ContentWrapper	styles={{marginTop: 0}} align='center' label="Bounties">
								<LargeBody align='center'> 
									Send <WokeSpan>WOKENs</WokeSpan> to new users to receive a bonus when they join.
								</LargeBody>
								<TransactionList
									listItems={rewardEvents}
								/> 
				</ContentWrapper>
				</Tabs>
			</BottomHolder>
		</Footer>
		</>
	);
}

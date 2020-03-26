import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

import PaneTabs from '../../layouts/tabs/tabs-panes';
import TransactionList from '../../layouts/list-transactions';
import FlexColumn from '../../layouts/flex-column'

import AvatarHeader from '../../components/header-avatar';
import WokeSpan from '../../components/text/span-woke';
import SendTransferForm from  '../../components/forms/send-transfer'
import LargeBody from '../../components/text/body-large';

const useStyles = makeStyles(theme => ({
	balanceText: {
		fontSize: '38px',
		lineHeight: '40px',
		fontWeight: 700,
	},

	placeholder: {
		width: '100%',
		backgroundColor: 'white',
		position: 'static',
	//	height: '50vh',
		minHeight: '50%',
		//flexGrow: 3,
		border: '5px',
	},
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
	const theme = useTheme();

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

	const responsive = {
		[theme.breakpoints.up('sm')]: {
			order: 1
		},
		[theme.breakpoints.up('md')]: {
			order: 10
		},
	}
	
	const renderBalance = () => (
		<Typography variant="h3" fontSize='38px' align="center" order={3}>
			{balance}<WokeSpan styles={{fontSize: '30px'}}> W</WokeSpan>
		</Typography>
	);

	const renderTransfer = () => (
		<SendTransferForm order={4}
			sendTransfers={sendTransfers}
			pending={sendTransfers.pending}
			usernamePlaceholder='username...'
			amountPlaceholder='amount'
			suggestions={friends}
		/>
	);

	const renderHeader = () => (
				<AvatarHeader order={0}
					src={avatar}
					handle={props.user.handle}
				/>
	);

	const renderPaneTabs = () => (
		<PaneTabs order={responsive.order}>
			<TransactionList
				label="Transfers"
				listItems={transferEvents}
			/>
			<FlexColumn	styles={{marginTop: 0}} align='center' label="Bounties">
				<LargeBody align='center'> 
					Send <WokeSpan>WOKENs</WokeSpan> to new users to receive a bonus when they join.
				</LargeBody>
				<TransactionList
					listItems={rewardEvents}
				/> 
			</FlexColumn>
		</PaneTabs>
	);

	return (
		<>
			<FlexColumn styles={{
				justifyContent: 'space-between',
				height: '80%',
				width: '100%',
				small: {
					alignSelf: 'flex-start',
				}
			}}>
				<Box border={1} borderColor='text.primary' className={classes.placeholder}>
				</Box>
				{ renderPaneTabs() }
			</FlexColumn>
		</>
	);
}

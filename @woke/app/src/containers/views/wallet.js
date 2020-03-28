import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

import ColumnSplit from '../../layouts/split-column';
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
		flexGrow: 2,
	//	height: '50vh',
		minHeight: '50%',
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

	const renderHeader = (heightVH) => (
				<AvatarHeader order={0}
					styles={{height: `${heightVH}vh`}}
					alignSelf='flex-start'
					src={avatar}
					handle={props.user.handle}
				/>
	);

	const renderPaneTabs = () => (
		<PaneTabs order={responsive.order} flexGrow={1}>
			<TransactionList
				label="Transfers"
				listItems={transferEvents}
			/>
			<FlexColumn	styles={{width: '0px'}} align='center' label="Bounties">
				<LargeBody align='center'> 
					Send <WokeSpan>WOKENs</WokeSpan> to new users to receive a bonus when they join.
				</LargeBody>
				<TransactionList
					listItems={rewardEvents}
				/> 
			</FlexColumn>
		</PaneTabs>
	);

	const headerHeight = 15;
	return (<>
		<ColumnSplit
			first={<>
				{ renderHeader(headerHeight) }
			</>}
			second={<>
				<div style={{ height: `${headerHeight/2}vw`}}/>
				{ renderPaneTabs() }
			</>}
		/>
	</>);
}

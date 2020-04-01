import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

import SplitColumns from '../../layouts/split-column';
import PaneTabs from '../../layouts/tabs/tabs-panes';
import TransactionList from '../../layouts/list-transactions';
import FlexColumn from '../../layouts/flex-column'

import AvatarHeader from '../../components/header-avatar';
import WokeSpan from '../../components/text/span-woke';
import TransferTokensForm from  '../../components/forms/tokens-transfer'
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
	
	const balanceSizeREM = 8;
	const renderBalance = () => (<>
		<Typography variant="h3"align="center" order={3}
			style={{
				//marginTop: '5%',
				marginBottom: '5%',
				fontSize: `${balanceSizeREM}rem`
			}} 
		>
			<LargeBody alignSelf='flex-start' color='secondary' styles={{textAlign: 'left'}}> 
				balance
			</LargeBody>
			{balance}<WokeSpan styles={{fontSize: `${balanceSizeREM*0.7}rem`}}> W</WokeSpan>
		</Typography>
	</>);

	const renderTransferOld = () => (
		<SendTransferForm order={4}
			sendTransfers={sendTransfers}
			pending={sendTransfers.pending}
			usernamePlaceholder='username...'
			amountPlaceholder='amount'
			suggestions={friends}
		/>
	);

	const renderTransfer = () => (
		<TransferTokensForm 
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
		<PaneTabs order={responsive.order} styles={{
			tabHeight: '6vh',
		}}> 
			<TransactionList
				label="History"
				itemHeightVH={5}
				styles={{ }}
				listItems={transferEvents}
			/>
			<FlexColumn	styles={{width: '0px'}} align='center'
				label="Earnings"
			>
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
	const headerSpacer = (vh) => (
				<div style={{
					display: 'inline-block',
					// @fix Smaller height on repsonsive (header height/2)
					minHeight: `${vh}vh`
				}}/>
	);

	return (<>
		<SplitColumns
			first={<>
				{ renderHeader(headerHeight) }
				{ headerSpacer(headerHeight/2) }
				<FlexColumn styles={{
					width: '100%',
					maxWidth: '100%', // limit to width of split columns
					justifyContent: 'space-evenly',
					alignSelf: 'stretch',
				}}>
					{ renderBalance() }
					{ renderTransfer() }
				</FlexColumn>
			</>}
			second={<>
				{ headerSpacer(headerHeight*1.5) }
				{ renderPaneTabs() }
			</>}
		/>
	</>);
}

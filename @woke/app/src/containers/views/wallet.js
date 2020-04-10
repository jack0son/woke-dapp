import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Hidden from '@material-ui/core/Hidden';

// Layout
import SplitColumns from '../../layouts/split-column';
import PaneTabs from '../../layouts/tabs/tabs-panes';
import TransactionList from '../../layouts/list-transactions';
import FlexColumn from '../../layouts/flex-column'
import LargeBody from '../../components/text/body-large';

// Components
import AvatarHeader from '../../components/header-avatar';
import Balance from  '../../components/wallet-balance'
import WokeSpan from '../../components/text/span-woke';
import TransferTokensForm from  '../../components/forms/tokens-transfer'

import { useRootContext } from '../../hooks/root-context';

const headerHeight = 15;
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

	headerSpacer: {
		width: '100%',
		alignSelf: 'flex-start',
		minHeight: `${headerHeight/2}vh`,
		[theme.breakpoints.down('sm')]: {
			minHeight: `${headerHeight/4}vh`,
		},
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

	const { setHeaderChildren } = useRootContext();

	//setHeaderChildren(children => ([ ...children, renderHeader(headerHeight) ]));

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

	const renderHeader = heightVH => (<>
		<AvatarHeader order={0}
			styles={{height: `${heightVH}vh`}}
			alignSelf='flex-start'
			src={avatar}
			handle={props.user.handle}
		/>
		<div className={classes.headerSpacer}/>
	</>);

	const avatarHeader = React.useMemo(() => renderHeader(headerHeight));
	React.useEffect(() => {
		setHeaderChildren([avatarHeader]);
		return () => {
			setHeaderChildren([]);
		}
	}, [])

	const responsive = {
		[theme.breakpoints.up('sm')]: {
			order: 1
		},
		[theme.breakpoints.up('md')]: {
			order: 10
		},
	}

	const renderTransfer = () => (
		<TransferTokensForm order={2}
			sendTransfers={sendTransfers}
			pending={sendTransfers.pending}
			usernamePlaceholder='username...'
			amountPlaceholder='amount'
			suggestions={friends}
			balance={balance}
		/>
	);

	const makePendingTransfers = () => {
		return [{
			type: 'send',
			counterParty: sendTransfers.currentTransfer.recipient,
			pending: true,
			...sendTransfers.currentTransfer,
		}];
	}

	const renderPendingTransfer = () => {
		// @brokenwindow wait until current transfer has been set
		if(sendTransfers.pending && sendTransfers.currentTransfer.amount) {
			return (
		<FlexColumn styles={{
			width: '50%',
			minWidth: '25vw',
			marginTop: '2%',
			small: {
				marginTop: '0%',
				width: '100%',
			}
		}}>
			<TransactionList
				sendTransfers={sendTransfers}
				fontSize="1.2rem"
				label="Pending"
				itemHeightVH={5}
				itemHeightVHSmall={4}
				styles={{ }}
				listItems={makePendingTransfers()}
			/>
		</FlexColumn>
			);
		}
	};

	const renderPaneTabs = () => (
		<PaneTabs order={responsive.order} styles={{
			tabHeight: '6vh',
		}}> 
			<TransactionList
				label="History"
				fontSize="1.2rem"
				itemHeightVH={5}
				itemHeightVHSmall={4}
				styles={{ }}
				sendTransfers={sendTransfers}
				listItems={transferEvents}
			/>
			<FlexColumn	styles={{}} //align='center'
				label="Earnings"
			>
				<TransactionList
					fontSize="1.2rem"
					itemHeightVH={5}
					itemHeightVHSmall={4}
					listItems={rewardEvents}
				/> 
				{ rewardEvents.length < 4 ? (<>
					<LargeBody align='center'
						styles={{
							textAlign: 'justify',
							fontSize: `${2*0.7}rem`,
							linHeight: `${2*0.7}rem`,
							marginTop: '8%',
							marginBottom: '5%',
							paddingLeft: '10%',
							paddingRight: '10%',
						}}
					> 
						Tribute <WokeSpan>WOKENs</WokeSpan> to new users to earn an elightenment bonus when they join.
					</LargeBody>
				</>) : null }
			</FlexColumn>
		</PaneTabs>
	);

	const renderBalance = () => <Balance balance={balance}/>

		return (<>

			<SplitColumns
				first={<>
					<FlexColumn styles={{
						width: '100%',
						maxWidth: '100%', // limit to width of split columns
						justifyContent: 'space-evenly',
						//alignSelf: 'stretch',
						small: {
							height: '100%',
						}
					}}>
						{ renderBalance() }
						{ renderTransfer() }
						{ renderPendingTransfer() }
					</FlexColumn>
				</>}
				second={<>
					{ renderPaneTabs() }
				</>}
			/>
		</>);
}

import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Hidden from '@material-ui/core/Hidden';
import Link from '@material-ui/core/Link';

// Layout
import SplitColumns from '../../layouts/split-column';
import PaneTabs from '../../layouts/tabs/tabs-panes';
import TransactionList from '../../layouts/list-transactions';
import FlexColumn from '../../layouts/flex-column'
import FlexRow from '../../layouts/flex-row'

// Components
import AvatarHeader from '../../components/wallet/header-avatar';
import Balance from  '../../components/wallet/balance';
import Tutorial from  '../../components/wallet/tutorial';
import TransferTokensForm from  '../../components/forms/tokens-transfer';
import Spinner from '../../components/progress/spinner-indeterminate';
import XLBody from '../../components/text/body-xl';
import SmallBody from '../../components/text/body-standard';

import { useRootContext } from '../../hooks/root-context';

const prettyName = (name) => name.includes('goerli') || name.includes('production') ? 'Goerli' : name;

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
		sendTransferInput,
		tokenAddress,
		network,
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

	const renderHeader = heightVH => (<React.Fragment key="avater_header">
		<AvatarHeader order={0}
			styles={{height: `${heightVH}vh`}}
			alignSelf='flex-start'
			src={avatar}
			handle={props.user.handle}
			key="header-avatar"
		/>
		<div className={classes.headerSpacer} key="header-spacer"/>
	</React.Fragment>);

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

	const renderTransfer = () => {
		if(balance == null) {
			return null;
		} else if (balance > 0) {
			return <TransferTokensForm order={2}
				sendTransferInput={sendTransferInput}
				pending={sendTransferInput.pending}
				usernamePlaceholder='username...'
				amountPlaceholder='amount'
				suggestions={friends}
				balance={balance}
			/>;
		} else {
			return (
				<FlexColumn styles={{
					width: '100%',
					maxWidth: '100%', // limit to width of split columns
					justifyContent: 'center',
					alignItems: 'center',
					//alignSelf: 'stretch',
					height: '25vh',
					small: {
						height: '100%',
					}
				}}>
					<XLBody color='primary'>You are broke 👎</XLBody>
				</FlexColumn>
			);
		}
	}

	const makePendingTransfers = () => {
		return [{
			type: 'send',
			counterParty: sendTransferInput.currentTransfer.recipient,
			pending: true,
			...sendTransferInput.currentTransfer,
		}];
	}

	const renderPendingTransfer = () => {
		// @brokenwindow wait until current transfer has been set
		if(sendTransferInput.pending && sendTransferInput.currentTransfer.amount) {
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
						sendTransferInput={sendTransferInput}
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
			<FlexColumn	styles={{
				width: '100%',
			}}
				label="Tributes"
			>
				<TransactionList
					fontSize="1.2rem"
					itemHeightVH={5}
					itemHeightVHSmall={4}
					//styles={{ }}
					//sendTransferInput={sendTransferInput}
					listItems={transferEvents}
				/>
				{ transferEvents.length < 3 ? <Tutorial choice='transfers'/> : null }
			</FlexColumn>
			<FlexColumn	styles={{
				width: '100%',
			}}
				label="Summoned"
			>
				<TransactionList
					fontSize="1.2rem"
					itemHeightVH={5}
					itemHeightVHSmall={4}
					listItems={rewardEvents}
				/> 
				{ transferEvents.length < 4 ? <Tutorial choice='rewards'/> : null }
			</FlexColumn>
		</PaneTabs>
	);

	const NetworkLink  = () => (
		<Link underline='hover' href={`https://goerli.etherscan.io/address/${tokenAddress}`} target='_blank' rel='noopener noreferrer'> <SmallBody styles={{fontSize: '.8rem', small: {fontSize: '.8rem'}}}>{`${prettyName(network.name)}: ${tokenAddress}`}</SmallBody></Link>
	);

	const renderBalance = () => balance == null ? <Spinner/> : <Balance balance={balance}/>;

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

			<FlexRow order={5} styles={{justifyContent: 'flex-end', alignItems: 'flex-end'}}>
				<br/>
				<NetworkLink/>
			</FlexRow>
		</>);
}

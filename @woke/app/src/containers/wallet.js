import React from 'react';
import { useEffect, useState, useReducer } from 'react'
import dayjs from 'dayjs';
import { timeSince } from '../lib/utils';
//import '../App.css';

// View container
import Wallet from './views/wallet';
import Loading from './views/loading';

// Hooks
import { useTwitterContext } from'../hooks/twitter';
import { useWeb3Context } from '../hooks/web3context';
import useBlockCache from '../hooks/blockcache';
import useTransferEvents from '../hooks/woke-contracts/events-transfer';
import useBonusEvents from '../hooks/woke-contracts/events-bonus';
import useTransferInput from '../hooks/woke-contracts/transfer-input';
//import useLiveBalance from '../hooks/live-balance';

export default function WalletContainer(props) {
	const {myUserId, myHandle} = props;
	const {
		web3,
		network,
		account,
		useSubscribeCall,
		useContract,
	} = useWeb3Context();
	const [error, setError] = useState(null);

	const wokeToken = useContract('WokeToken');

	// Move into seperate hook
	//const [fetchingTxData, setFetchingTxData] = useState(false);
	//const [txList, setTxList] = useState([]);
	const balance = useSubscribeCall('WokeToken', 'balanceOf', account);

	// Custom hooks
	const twitter = useTwitterContext();
	const twitterUsers = twitter.userList;
	const friends = twitter.useFriends({userId: myUserId, max:500});

	const blockCache = useBlockCache();
	const transferEvents = useTransferEvents(myUserId, blockCache);
	const rewardEvents = useBonusEvents(blockCache);

	useEffect(() => {
		twitterUsers.addId(myUserId);
	}, [])
	const myUserData = twitterUsers.state.data[myUserId];

	const checkUserExists = async (userId, handle) => {
		try {
			let user = await twitter.client.getUserData(userId, handle);
			return user;
		} catch (error) {
			setError('User does not exist');
			if(error[0] && error.message) {
				console.log('Failed to find userId: ', error.message)
			} else {
				console.log('Failed to find userId: ', error);
			}
			return false;
		}
	}

	const sendTransferInput = useTransferInput({
		defaultRecipient: '',
		defaultAmount: 1,
		balance,
		checkUserExists: checkUserExists,
		twitterUsers
	});

	return (
		<>
		{ myUserData ?
			<Wallet
				balance={balance}
				user={myUserData}
				userData={twitterUsers.state.data}
				transferEvents={transferEvents}
				rewardEvents={rewardEvents}
				sendTransferInput={sendTransferInput}
				friends={friends}
				network={network}
				tokenAddress={wokeToken.options.address}
			/>
			 : <Loading message={'A Woken shared is a Woken doubled.'}/>}
		</>
	);
}

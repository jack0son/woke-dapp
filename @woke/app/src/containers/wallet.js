import React from 'react';
import { useEffect, useState, useReducer } from 'react'
import dayjs from 'dayjs';
import { timeSince } from '../lib/utils';
//import '../App.css';

// View container
import Wallet from './views/wallet'
import Loading from './views/loading'

// Hooks
import { useTwitterContext } from'../hooks/twitter/index.js'
import { useWeb3Context } from '../hooks/web3context'
import useBlockCache from '../hooks/blockcache'
import useTransferEvents from '../hooks/woke-contracts/transferevents'
import useRewardEvents from '../hooks/woke-contracts/rewardevents'
import useSendTransferInput from '../hooks/woke-contracts/sendtransfer'

const getwoketoke_id = '932596541822419000'

export default function WalletContainer(props) {
	// Sign in process params
	const myUserId = props.userId;
	const myHandle = props.userId;

	const {
		web3,
		account,
		useSubscribeCall,
	} = useWeb3Context();


	const [error, setError] = useState(null);

	// Move into seperate hook
	const [fetchingTxData, setFetchingTxData] = useState(false);
	const [txList, setTxList] = useState([]);

	const balance = useSubscribeCall('WokeToken', 'balanceOf', account);

	// Custom hooks
	const twitter = useTwitterContext();
	console.log(twitter);
	const twitterUsers = twitter.userList;
	const friends = twitter.useFriends({userId: myUserId, max:500});

	const blockCache = useBlockCache();
	const transferEvents = useTransferEvents(myUserId, twitterUsers, blockCache);
	const rewardEvents = useRewardEvents(twitterUsers, blockCache);

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

	const sendTransfers = useSendTransferInput({
		defaultRecipient: 'getwoketoke',
		defaultAmount: 1,
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
				sendTransfers={sendTransfers}
				friends={friends}
			/>
			 : <Loading/>}
		</>
	);
}

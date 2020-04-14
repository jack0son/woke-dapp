import React from 'react';

// Container View
import WalletView from '../views/wallet';

// Dummy state
import useSendTransfers from '../../hooks/mocks/sendtransfer';
import users from '../../constants/test-users';

// Lib
import { timeSince } from '../../lib/utils';


export default function WalletContainer() {
	const user = {
		id: '',
		handle: 'getwoketoke',
		avatar: 'images/avatar-getwoke.jpg'
	}

	const friends = Object.values(users);
	const sendTransfers = useSendTransfers(friends);

	return (
		<WalletView
			user={user}
			friends={friends}
			userData={users}
			balance={1305}
			transferEvents={transferList.slice(0,15)}
			//transferEvents={[]} //transferList.slice(0,5)}
			rewardEvents={rewardList}
			sendTransfers={sendTransfers}
		/>
	);
}

const rewardList = [
	{
		counterParty: users['12345'],
		returnValues: {
			amount: '25',
		},
		type: 'receive',
		timestamp: '2019-10-07',
		timeSince: timeSince('2019-10-07')
	}
];

const transferList = [ 
	rewardList[0],
	{
		counterParty: users['13'],
		returnValues: {
			amount: '25',
		},
		type: 'send',
		timestamp: '2019-09-28',
		timeSince: timeSince('2019-09-28')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
	{
		counterParty: users['11'],
		returnValues: {
			amount: '12',
		},
		type: 'receive',
		timestamp: '2019-09-12',
		timeSince: timeSince('2019-09-12')
	},
]

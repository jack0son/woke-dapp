import React, { useCallback, useState, useEffect } from 'react';
import { useWeb3Context } from './web3context';

// @returns balance:BN
export default function useLiveBalance( address, opts) {
	const { web3, useSubscribeBlock } = useWeb3Context();
	const [balance, setBalance] = useState(null);

	const BN = web3.utils.BN;
	const toEth = wei => web3.utils.fromWei(wei, 'ether');
	const valStr = (wei, delim = ', ') => `${toEth(wei)} ETH${delim}${wei.toString()} wei`;
	
	const getBalance = useCallback(async () => {
		let balance = new BN(await web3.eth.getBalance(address));
		console.log(`live balance: ${valStr(balance)}`);
		setBalance(balance);
	}, [address]);

	useEffect(() => {
		web3.eth.getBalance(address).then(balance => {
			setBalance(new BN(balance));
		});
	}, []);

	useSubscribeBlock(getBalance);

	return balance;
}

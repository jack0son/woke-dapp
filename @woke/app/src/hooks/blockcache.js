import React, { useState, useMemo } from 'react';
import { useWeb3Context } from './web3context';


export default function useBlockCache() {
	const {
		web3,
		account,
		useEvents
	} = useWeb3Context();

	const [blockCache, setBlockCache] = useState({});

	async function addBlocks(blockNumbers) {
		let newBlocks = {};
		await Promise.all(blockNumbers.map((bn, i) => {
			if(!blockCache[bn]) {
				return web3.eth.getBlock(bn)
					.then(block => {
						newBlocks[bn] = block;
					}).catch(error => {
						console.log(`Failed to retrieve block ${bn}:\n`, error);
					});
			}
		}));
		setBlockCache(blockCache => ({blockCache, ...newBlocks}));
	}

	const blockNumbers = useMemo(() => {
		return Object.keys(blockCache);
	}, [blockCache]);

	return {
		addBlocks,
		blocks: blockCache,
		blockNumbers
	};
}

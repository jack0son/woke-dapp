import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useWeb3Context } from './web3context';


export default function useBlockCache() {
	const {
		web3,
		account,
		useEvents
	} = useWeb3Context();

	const [blockCache, setBlockCache] = useState({});

	const blockNumbers = useMemo(() => {
		return Object.keys(blockCache);
	}, [blockCache]);

	const addBlocks = useCallback((blockNumbers) => {
		async function addBlocks(blockNumbers) {
			console.log(blockNumbers);
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
			setBlockCache(blockCache => ({...blockCache, ...newBlocks}));
		}

		addBlocks(blockNumbers);
	}, [blockNumbers, blockCache]);


	function addBlock(bn) {
		if(!blockCache[bn]) {
				web3.eth.getBlock(bn)
					.then(block => {
						setBlockCache(blockCache => ({...blockCache, block}));
					}).catch(error => {
						console.log(`Failed to retrieve block ${bn}:\n`, error);
					});
		}
	}

	const mergeBlockNumbers = useCallback((blockNumberList) => {
		addBlocks(blockNumberList.filter(bn => !blockNumbers.includes(bn)));
	}, [addBlocks, blockNumbers]);

	useEffect(()=> {
		console.log(blockCache);
	}, [blockCache])

	return {
		addBlocks,
		addBlock,
		mergeBlockNumbers,
		blocks: blockCache,
		blockNumbers,
	};
}

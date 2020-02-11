import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useWeb3Context } from './web3context';
import { createObjectCache } from '../lib/utils';


const cache = createObjectCache('block_cache');
export default function useBlockCache() {
	const {
		web3,
		account,
		useEvents
	} = useWeb3Context();

	const [blockCache, setBlockCache] = useState(cache.retrieve() || {});

	const blockNumbers = useMemo(() => {
		return Object.keys(blockCache);
	}, [blockCache]);

	const addBlocks = useCallback((_bns) => {
		async function addBlocks(_blockNumbers) {
			let newBlocks = {};
			await Promise.all(_blockNumbers.map((bn, i) => {
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

		addBlocks(_bns);
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
		if(blockCache) {
			cache.store(reduceCache(blockCache));
		}
	}, [blockCache])

	return {
		addBlocks,
		addBlock,
		mergeBlockNumbers,
		blocks: blockCache,
		blockNumbers,
	};
}

function reduceCache(cache) {
	let r = {}
	Object.values(cache).forEach(b => {
		if(b && b.number) {
			r[b.number] = {
				blockNumber: b.number,
				timestamp: b.timestamp,
			};
		}
	})
	return r;
}

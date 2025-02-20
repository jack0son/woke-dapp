import React, {
	useContext,
	createContext,
	useState,
	useEffect,
	useMemo
} from 'react';
import { loadContractArtifacts } from '../../lib/web3/web3-config'

import createUseContract from './create-use-contract';
import createUseContractSubscriptions from './create-use-contract-subscriptions';
import createUseSubscribeContract from './create-use-subscribe-contract';
import createUseSubscribeCall from './create-use-subscribe-call';
import createUseSubscribeBlock from './create-use-subscribe-block';
import createUseSend from './create-use-send';
import createUseEvents from './create-use-events';
//import createGetPastEvents from './create-get-events';

import useWeb3Instance from './use-web3-instance';
export { useWeb3Instance };

// Contract artifacts are defined manually for now. Can be generalised for use
// in another project.
const artifacts = loadContractArtifacts();
const Context = createContext();
export const useWeb3Context = () => useContext(Context);

export const Web3ContextProvider = ({children, web3, networkId, account, network}) => {
	// @TODO set default web3 send options
	const useContract = useMemo(() => createUseContract(web3, artifacts, networkId), [web3, artifacts, networkId]);
	//const getPastEvents = useMemo(() => createGetPastEvents(web3), [web3]);
	const useContractSubscriptions = createUseContractSubscriptions(web3);
	const useSubscribeContract = useMemo(() => createUseSubscribeContract(web3), [web3]);
	const useSubscribeCall = useMemo(() => createUseSubscribeCall(web3), [web3]);
	const useSubscribeBlock = useMemo(() => createUseSubscribeBlock(web3), [web3]);
	const useSend = useMemo(() => createUseSend(web3), [web3]);
	const useEvents = useMemo(() => createUseEvents(web3), [web3]);

	return (
		<Context.Provider
			value={useMemo(
				() => ({
					web3,
					networkId,
					network,
					account,
					useContract,
					useContractSubscriptions,
					useSubscribeContract,
					useSubscribeCall,
					useSubscribeBlock,
					useSend,
					useEvents,
					//getPastEvents
				}),
				[
					web3,
					networkId,
					network,
					account,
					useContract,
					useContractSubscriptions,
					useSubscribeContract,
					useSubscribeCall,
					useSubscribeBlock,
					useSend,
					useEvents,
					//getPastEvents
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}

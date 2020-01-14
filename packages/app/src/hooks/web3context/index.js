import React, {
	useContext,
	createContext,
	useState,
	useEffect,
	useMemo
} from 'react';
import Web3 from 'web3';
import { getContract } from '../../lib/web3/web3-utils';
import { loadContractArtifacts } from '../../lib/web3/web3-config'

import createUseContract from './create-use-contract';
import createUseContractSubscriptions from './create-use-contract-subscriptions';
import createUseSubscribeContract from './create-use-subscribe-contract';
import createUseSubscribeCall from './create-use-subscribe-call';
import createUseSend from './create-use-send';
import createUseEvents from './create-use-events';
//import createGetPastEvents from './create-get-events';

// Contract artifacts are defined manually for now. Can be generalised for use
// in another project.

const artifacts = loadContractArtifacts();

const Context = createContext();
export const useWeb3Context = () => useContext(Context);


export const Web3ContextProvider = ({children, web3, networkId, account}) => {
	// @TODO set default web3 send options
	const useContract = useMemo(() => createUseContract(web3, artifacts, networkId), [web3, artifacts, networkId]);
	//const getPastEvents = useMemo(() => createGetPastEvents(web3), [web3]);
	const useContractSubscriptions = createUseContractSubscriptions(web3);
	const useSubscribeContract = useMemo(() => createUseSubscribeContract(web3), [web3]);
	const useSubscribeCall = useMemo(() => createUseSubscribeCall(web3), [web3]);
	const useSend = useMemo(() => createUseSend(web3), [web3]);
	const useEvents = useMemo(() => createUseEvents(web3), [web3]);

	return (
		<Context.Provider
			value={useMemo(
				() => ({
					web3,
					networkId,
					account,
					useContract,
					useContractSubscriptions,
					useSubscribeContract,
					useSubscribeCall,
					useSend,
					useEvents,
					//getPastEvents
				}),
				[
					web3,
					networkId,
					account,
					useContract,
					useContractSubscriptions,
					useSubscribeContract,
					useSubscribeCall,
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

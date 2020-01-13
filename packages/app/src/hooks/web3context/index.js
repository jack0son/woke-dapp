import React, {
	useContext,
	createContext,
	useState,
	useEffect,
	useMemo
} from 'react';
import Web3 from 'web3';
import { getContract } from '../../lib/web3/web3-utils';

import createUseContract from './create-use-contract';
import createUseContractSubscriptions from './create-use-contract-subscriptions';
import createUseSubscribeContract from './create-use-subscribe-contract';
import createUseSubscribeCall from './create-use-subscribe-call';
import createUseSend from './create-use-send';
import createUseEvents from './create-use-events';
//import createGetPastEvents from './create-get-events';

// Contract artifacts are defined manually for now. Can be generalised for use
// in another project.
import { getWeb3Network, loadContractArtifacts } from '../../config/web3-helpers'

const network = getWeb3Network();
const artifacts = loadContractArtifacts();

const Context = createContext();
export const useWeb3Context = () => useContext(Context);

// @TODO identify why web3 call sometimes returns incorrect network ID
export async function initWeb3(provider) {
	// Check connection
	const web3 = new Web3(provider);
	await web3.eth.net.isListening();
	let networkId;
	while(networkId != network.id) {
		if(networkId) {
			console.warn(`Expected network ID from config ${network.id}, but got ${networkId}`);
		}
		networkId = await web3.eth.net.getId()
	}

	console.log("NETWORK ID: ", networkId);

	return {web3, networkId};
}

export const Web3ContextProvider = ({children, web3, networkId, account}) => {
	const [artifacts, setArtifacts] = useState(null);

	useEffect(() => {
		loadContractArtifacts().then(setArtifacts);
	}, []);

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

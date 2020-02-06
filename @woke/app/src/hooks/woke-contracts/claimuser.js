import React, {
	useEffect,
	useCallback,
	useReducer,
	useMemo,
	useState,
	useRef,
} from 'react'

import { useWeb3Context } from '../web3context';
import * as claimStates from './claimuser-states';
import * as statuses from './claim-status';

import { genClaimString } from '../../lib/web3/web3-utils'
import { findClaimTweet } from '../../lib/twitter-helpers'
import { setSyncTimeout } from '../../lib/utils'
import { useTwitterContext } from '../twitter/index.js'
//import { useIsMounted } from '../util-hooks'

const {statesMap, statesList, statesLabels} = claimStates;
const states = statesMap;

const logVerbose = false ? console.log : () => {};

function validQueryId(qid) {
	return qid !== null && qid !== undefined &&
	typeof quid === 'string' &&
	parseInt(qid) !== 0;
}

// TODO implement a an unmount variable to cancel async calls when claimuser
// unmounts
export default function useClaimUser({userId, userHandle, claimStatus}) {
	const {
		web3,
		account,
		useContract,
		useEvents,
		useSend,
		useSubscribeCall,
	} = useWeb3Context();
	const twitterClient = useTwitterContext().client;
	const isMounted = useRef(true)
	useEffect(() => {
		return () => {
			isMounted.current = false
		}
	}, []);

	//const [error, setError] = useState(null);

	// @dev Knowledge of the state of the claimUser process can come from
	// contract calls, new transactions sent, or contract events, depending on
	// when the app has been closed and reopened. Therefore use a reduce
	// funciton to map these events on to the claimUser stage
	function reduce(state, action) {
		//console.log(`Reduce: action:${action.type}, payload:${action.payload}`);
		//console.log(`Actions thisRender:${thisRender}, actionCount:${actionCount + 1}`);
		if(isMounted.current) {
			console.log(action);
			switch(action.type) {
				case 'already-claimed': {
					console.log(`Reduce - already-claimed`);
					return {
						...state,
						stage: states.CLAIMED,
					}
				}

				case 'twitter-event': {
					if(action.error && state.stage < states.FOUND_TWEET) {
						if(state.stage === states.CONFIRMED) {
							return {...state, error: 'Could not find your tweet. Please refresh and try again'}
						} else {
						}
						return state;
					}

					if(action.name === 'tweet-found' && state.stage < states.FOUND_TWEET) {
						return {...state, stage: states.FOUND_TWEET}
					}

					if(action.name === 'tweet-confirmed' && state.stage <= states.CONFIRMED) {
						return {...state, stage: states.CONFIRMED}
					}

					if(action.name === 'tweet-retweet' && state.stage <= states.CONFIRMED) {
						return {...state, stage: states.READY}
					}

					if(action.name === 'tweetbutton-clicked' && state.stage < states.TWEETED) {
						return {...state, stage: states.TWEETED}
					}

					if(action.name === 'tweet-not_found' && state.stage === states.CONFIRMED) {
						return {...state, stage: states.ERROR, error: action.error}
					}

					return state;
					break;
				}

				case 'web3-event': {
					//console.log(`\tReduce: web3-event ${action.name} with payload ${action.payload}`, action);

					if(action.error) {
						if(state.stage == states.ERROR) {
							return state;
						}
						return {...state, stage: states.ERROR, error: action.error}
					}

					if(action.name == 'Claimed') {
						console.log(`\t${action.name} triggered states.CLAIMED`);
						return {...state, stage: states.CLAIMED}
					}

					if(action.name == 'TweetStored' && state.stage < states.STORED_TWEET) {
						console.log(`\t${action.name} triggered states.STORED_TWEET`);
						return {...state, stage: states.STORED_TWEET}
					}

					// Accept both lodged events with or without query ID, hence <=
					if(action.name == 'Lodged' && state.stage <= states.LODGED) {
						console.log(`\t${action.name} triggered states.LODGED`);
						if(!(action.payload && validQueryId(action.payload.queryId))) {
							if(validQueryId(state.queryId)) {
							// If already got query ID, don't change state
								return state;
							}

							return {...state, stage: states.LODGED};
						}
						return {
							...state, 
							queryId: action.payload.queryId,
							stage: states.LODGED
						}
					}

					return state;
					break;
				}

				case 'sent-transaction': {
					switch(action.payload) {
						case 'claim': {
							return {...state, stage: states.LODGING}
						}

						case 'claim-error': {
							return {...state, stage: states.ERROR, error: action.error}
							//return {...state, stage: states.FOUND_TWEET}
						}

						case 'fulfill': {
							return {...state, stage: states.FINALIZING}
						}

						case 'fulfill-error': {
							return {...state, stage: states.ERROR, error: action.error}
							//return {...state, stage: states.STORED_TWEET}
						}
					}
					return state;
					break;
				}

				default: {
					return state;
				}
			}
		}
		return state;
	}

	const initialState = {
		stage: states.READY,
		queryId: null,
	}

	const [claimState, dispatch] = useReducer(reduce, initialState);
	const safeDispatch = useCallback((action) => {
		if(isMounted) {
			dispatch(action);
		}
	}, [dispatch, isMounted]);

	useEffect(() => {
		if(claimStatus === statuses.states.CLAIMED ) {
			dispatch({type: 'already-claimed'});
		} 
	}, [dispatch, claimStatus])

	/*
		// Async Dispatcher 
	useEffect(() => {
		switch(claimState.stage) {
			case: states.INIT: {
				break;
			}
			case: states.INIT: {
				break;
			}
			case: states.INIT: {
				break;
			}
		}
	}, [claimState, ...dispatchers])
	*/

	const WokeToken = useContract('WokeToken');
	const TwitterOracleMock = useContract('TwitterOracleMock');
	const gather = useRef(0);

	// 1. Gather initial contract state from events (race the contract calls)
	useEffect(() => {
		const gatherEventState = async () => {
	console.log(gather.current);
	gather.current++;
			let opts = {fromBlock: 0, toBlock: 'latest'};

			// Has Lodging occured?
			logVerbose('\t... initial getting lodge events');
			const lodgeEvents = await WokeToken.getPastEvents('Lodged', { ...opts,
				filter: { claimer: account}
			});

			if(lodgeEvents.length > 0) {
				const latestLodgeEvent = lodgeEvents[lodgeEvents.length - 1].returnValues;
				logVerbose('\t... initial getting tweet stored');
				const tweetEvents = await TwitterOracleMock.getPastEvents('TweetStored', { ...opts,
					filter: {queryId: latestLodgeEvent.queryId}
				});

				if(tweetEvents.length > 0) {
					dispatch({type: 'web3-event', name: 'TweetStored', payload: tweetEvents[tweetEvents.length - 1].returnValues});
				} else {
			console.log('\tgather triggered dispatch lodge');
					dispatch({type: 'web3-event', name: 'Lodged', payload: latestLodgeEvent, source: 'gather'})
				}
				return; 
			}

			return;
		}

		gatherEventState();
	}, []);


	const [claimString, setClaimString] = useState(null);
	useEffect(() => {
		const generateClaimString = async () => {
			const str = await genClaimString(web3, account, userId);
			setClaimString(str);
		}
		generateClaimString();
	}, [web3, account, userId])

	// 2. Gather claim-tweet status 
	function userClickedPostTweet() {
		dispatch({type: 'twitter-event', name: 'tweetbutton-clicked'});
	}

	function userDidNotTweet() {
		dispatch({type: 'twitter-event', name: 'tweet-retweet'});
	}

	function userConfirmedTweeted() {
		dispatch({type: 'twitter-event', name: 'tweet-confirmed'});
	}
	// Search for claim string
	const [fetchingTweet, setFetchingTweet] = useState(false);
	const confirmedPredicate = claimState.stage == states.CONFIRMED;

	useEffect(() => {
		const waitForTweet = async (userId) => {
			logVerbose('Searching for ', claimString);
			let tweet = null
			let count = 0;

			// Search for the tweet once initially, then until found
			const maxAttempts = claimState.stage < states.TWEETED ? 1 : 4;

			logVerbose(`\tsearching for claim tweet with ${maxAttempts} attempts`);
			while (!tweet && count < maxAttempts) {
				try {
					await setSyncTimeout(1000)
					tweet = await findClaimTweet(twitterClient, userId, '0xWOKE');

				} catch (error) {
					count += 1;
					logVerbose(`Could not find claim tweet on attempt ${count}`);
					logVerbose(error);
				}
			}

			if(tweet) {
				if(tweet.includes(claimString)) {
					dispatch({type: 'twitter-event', name: 'tweet-found'}); // No event name, default event logic
				} else {
					dispatch({type: 'twitter-event', error: 'Tweet does not match. Delete the previous tweet and retry'});
				}
			} else {
				dispatch({type: 'twitter-event', name:'tweet-not_found'})
			}
		}

		if(!fetchingTweet && claimString != null && claimState.stage < states.FOUND_TWEET) {
			setFetchingTweet(true);
			waitForTweet(userId);
			setFetchingTweet(false);
		}

	}, [userId, claimString, twitterClient, confirmedPredicate, claimState.stage, fetchingTweet])

	const tweetText = useSubscribeCall('TwitterOracleMock', 'getTweetText', userId);
	const lodgedPredicate = claimState.stage == states.LODGED;
	useEffect(() => {
		if(typeof tweetText == 'string' && tweetText.length >= claimString.length) {
			console.log('Got tweet from contract: ', tweetText);
			dispatch({type: 'web3-event', name: 'TweetStored', });
		}
	}, [tweetText, lodgedPredicate, claimString]);

	const hasLodgedRequestPredicate = claimState.stage < states.LODGED;
	const hasLodgedRequest = useSubscribeCall('WokeToken', 'lodgedRequest', userId);
	useEffect(() => {
		console.log('\thasLodgedRequest: ', hasLodgedRequest);
		if(hasLodgedRequestPredicate && hasLodgedRequest === true) {
			console.log('\tcontract call triggered dispatch lodge');
			dispatch({type: 'web3-event', name: 'Lodged', source: 'useCall'});
		}
	}, [tweetText, hasLodgedRequest, hasLodgedRequestPredicate]);


	// 3. Monitor state from events
	const events = {TweetStored: [], Claimed: [], Lodged: []};
	events.Claimed = useEvents('WokeToken', 'Claimed',
		useMemo(() => (
			{
				filter: { account: account},
				fromBlock: 0
			}
		), [account])
	);
	useEffect(() => {
		if(events.Claimed && events.Claimed.length > 0) {
			dispatch({type: 'web3-event', name: 'Claimed'});
		}
	}, [events.Claimed]) //events.Claimed && events.Claimed.length]);

	events.TweetStored = useEvents('TwitterOracleMock', 'TweetStored',
		useMemo(() => (
			{
				filter: { queryId: claimState.queryId },
				fromBlock: 0
			}
		), [claimState.queryId])
	);
	useEffect(() => {
		if(validQueryId(claimState.queryId) && events.TweetStored && events.TweetStored.length > 0) {

			let event = events.TweetStored[events.TweetStored.length - 1].returnValues;
			dispatch({type: 'web3-event', name: 'TweetStored', payload: event});
		}
	}, [claimState.queryId, events.TweetStored]); // && events.TweetStored.length]);

	events.Lodged = useEvents('WokeToken', 'Lodged',
		useMemo(() => (
			{
				filter: {claimer: account},
				fromBlock: 0
			}
		), [account])
	);
	useEffect(() => {
		if(events.Lodged && events.Lodged.length > 0) {
			// Use latest - there should only be one
			// Once oracle stores tweet text, fulfill the claim
			let event = events.Lodged[events.Lodged.length - 1].returnValues; 
			console.log('\tuseEvents triggered dispatch lodge');
			dispatch({type: 'web3-event', name: 'Lodged', payload: event, source: 'useEvents' });
		}
	}, [events.Lodged]); // && events.Lodged.length]);

	function hasEnoughEth () {
		//setError('Insufficient eth for transaction');
		return true;
	}

	const gWei = 1000000000; // 1 GWei
	let txOpts = {gas: 2000000, gasPrice: gWei * 30};
	const sendClaimUser = useSend('WokeToken', 'claimUser', txOpts);
	const sendFulfillClaim = useSend('WokeToken', '_fulfillClaim', txOpts);

	const handleSendClaimUser = (id, handle) => {
		if(!hasEnoughEth) {
			return;
		}

		if(sendClaimUser.send(id)) {
			console.log(`sendClaimUser(${userId})`)
			dispatch({type: 'sent-transaction', payload: 'claim'})
		} else {
			console.error('Failed to sendClaimUser');
		}
	}

	const handleSendFulfillClaim = () => {
		if(!hasEnoughEth) {
			return;
		}

		console.log(`sendFulfillClaim(${userId})`)
		sendFulfillClaim.send(userId);
		dispatch({type: 'sent-transaction', payload: 'fulfill'})
	}

	const foundTweetPredicate = claimState.stage === states.FOUND_TWEET;
	useEffect(() => {
		if(foundTweetPredicate) {
			handleSendClaimUser(userId, userHandle);
		}
	}, [userId, userHandle, foundTweetPredicate, handleSendClaimUser])

	const storedTweetPredicate = claimState.stage === states.STORED_TWEET;
	useEffect(() => {
		if(storedTweetPredicate) {
			handleSendFulfillClaim();
		}
	}, [storedTweetPredicate, handleSendFulfillClaim])


	// Monitor transaction states
	useEffect(() => {
		if(sendClaimUser.status) 
			console.log(`sendClaimUser.status: ${sendClaimUser.status}`);
		if(sendClaimUser.status == 'error') {
			// Retry
			//setError('Failed to publish claim on-chain. Please refresh.');
			dispatch({type: 'sent-transaction', payload: 'claim-error'})
		}
	}, [sendClaimUser.status])

	useEffect(() => {
		if(sendFulfillClaim.status) 
			console.log(`sendFulfillClaim.status: ${sendFulfillClaim.status}`);
		if(sendFulfillClaim.status == 'error') {
			// Retry
			//setError('Failed to complete claim on-chain. Please refresh.');
			dispatch({type: 'sent-transaction', payload: 'fulfill-error'})
		}
	}, [sendFulfillClaim.status])

	// Log once
	useEffect(() => {
		console.log('Claim account: ', account);
	}, [])

	useEffect(() => {
		console.log(`Claim stage update: ${claimState.stage}, ${statesList[claimState.stage]}`);
	}, [claimState.stage])

	return {
		submitClaim: handleSendClaimUser, 
		stage: claimState.stage, 
		stageList: statesList,
		stageLabels: statesLabels,
		stageMap: statesMap,
		stageTriggers: {
			userClickedPostTweet,
			userConfirmedTweeted,
			userDidNotTweet,
		},
		claimString,
		transactions: {
			sendClaimUser,
			sendFulfillClaim
		},
		error
	};
}


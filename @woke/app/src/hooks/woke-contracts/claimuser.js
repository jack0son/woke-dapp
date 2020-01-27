import React, {
	useEffect,
	useReducer,
	useMemo,
	useState,
} from 'react'

import { useWeb3Context } from '../web3context';
import * as claimStates from './claimuser-states';

import { genClaimString } from '../../lib/web3/web3-utils'
import { findClaimTweet } from '../../lib/twitter-helpers'
import { useTwitterContext } from '../twitter/index.js'
import { useIsMounted } from '../util-hooks'

const {statesMap, statesList} = claimStates;
const states = statesMap;

const logVerbose = false ? console.log : () => {};

// TODO implement a an unmount variable to cancel async calls when claimuser
// unmounts
export default (props) => {
	const {
		web3,
		account,
		useContract,
		useEvents,
		useSend,
		useSubscribeCall,
	} = useWeb3Context();
	const twitterClient = useTwitterContext().client;
	const isMounted = useIsMounted();

	const [error, setError] = useState(null);

	// @dev Knowledge of the state of the claimUser process can come from
	// contract calls, new transactions sent, or contract events, depending on
	// when the app has been closed and reopened. Therefore use a reduce
	// funciton to map these events on to the claimUser stage
	const reduce = (state, action) => {
		//console.log(`Reduce: action:${action.type}, payload:${action.payload}`);
		//console.log(`Actions thisRender:${thisRender}, actionCount:${actionCount + 1}`);
		if(isMounted) {
			switch(action.type) {
				case 'already-claimed': {
					console.log(`Reduce - already-claimed`);
					return {
						...state,
						gathering: false,
						stage: states.CLAIMED,
					}
				}

				case 'already-stored': {
					console.log(`Reduce - already-stored`);
					return {
						...state,
						gathering: false,
						stage: states.STORED_TWEET,
					}
				}

				case 'already-lodged': {
					console.log(`Reduce - already-lodged`);
					console.dir(state);
					return {
						...state,
						gathering: false,
						queryId: action.payload.queryId,
						stage: states.LODGED,
					}
				}

				case 'already-tweeted': {
					console.log(`Reduce - already-tweeted`);
					return {
						...state,
						gathering: false,
						stage: states.CONFIRMED,
					}
				}

				case 'done-gathering': {
					console.log(`Reduce - done-gathering`);
					return {
						...state,
						gathering: false,
					}
				}

				case 'twitter-event': {
					if(action.error && state.stage < states.FOUND_TWEET) {
						if(state.stage === states.CONFIRMED) {
							setError('Could not find your tweet. Please refresh and try again');
						}
						return state;
					}

					if(action.name === 'tweet-found' && state.stage < states.FOUND_TWEET) {
						return {...state, stage: states.FOUND_TWEET}
					}

					if(action.name === 'tweetbutton-clicked' && state.stage < states.TWEETED) {
						return {...state, stage: states.TWEETED}
					}

					if(action.name === 'tweet-not_found' && state.stage === states.CONFIRMED) {
						return {...state, stage: states.ERROR}
					}

					return state;
					break;
				}

				case 'web3-event': {
					console.log(`\tReduce: web3-event ${action.name} with payload ${action.payload}`, action);
					if(action.payload) console.dir(action.payload);

					if(!state.gathering) {
						if(action.err) {
							if(state.stage != states.ERROR) {
								// Preserve existing error
								setError(action.err);
							}
							return {...state, stage: states.ERROR}
						}

						if(action.name == 'Claimed') {
							console.log(`\t${action.name} triggered states.CLAIMED`);
							return {...state, stage: states.CLAIMED}
						}

						if(action.name == 'TweetStored' && state.stage < states.STORED_TWEET) {
							console.log(`\t${action.name} triggered states.STORED_TWEET`);
							return {...state, stage: states.STORED_TWEET}
						}

						if(action.name == 'Lodged' && state.stage < states.LODGED) {
							console.log(`\t${action.name} triggered states.LODGED`);
							return {
								...state, 
								queryId: action.payload.queryId,
								stage: states.LODGED
							}
						}
						console.log(`Reduce: web3-event triggered no state change`);
						return state;
						break;
					}

					console.log(`${action.name} event received before done gathering`);

					return state;
					break;
				}

				case 'contract-call': {
					if(action.err) {
						setError(action.err);
						console.log('states.ERROR: ', action.err);
						return {...state, stage: states.ERROR}
					}

					switch(action.payload) {
						case 'claimed': {
							console.log(`\t${action.type} triggered states.CLAIMED`);
							return {...state, stage: states.CLAIMED}
							break;
						}

						case 'unclaimed': {
							if(state.stage < states.READY) {
								return {...state, stage: states.READY}
							}
							return state;
							break;
						}

						default: {
							return state;
							break;
						}

					}
					break;
				}

				case 'sent-transaction': {
					switch(action.payload) {
						case 'claim': {
							return {...state, stage: states.LODGING}
						}

						case 'fulfill': {
							return {...state, stage: states.FINALIZING}
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
	}


	// Instead of 'gathering' use function for initialstate
	const initialState = {
		stage: states.INIT,
		queryId: null,
		gathering: true
	}

	const [claimState, unsafeDispatch] = useReducer(reduce, initialState);
	const dispatch = (action) => {
		if(isMounted) {
			unsafeDispatch(action);
		}
	}

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

	const WokeToken = useContract('WokeToken');
	const TwitterOracleMock = useContract('TwitterOracleMock');


	// 1. Gather initial contract state
	useEffect(() => {
		const gatherEventState = async () => {
			let fetches = [];
			let opts = {fromBlock: 0, toBlock: 'latest'};

			// Has Lodging occured?
			// @TODO replace with contract state
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
					dispatch({type: 'already-stored', payload: tweetEvents[tweetEvents.length - 1].returnValues});
				} else {
					dispatch({type: 'already-lodged', payload: latestLodgeEvent})
				}
				dispatch({type: 'done-gathering'});
				return; 
			}

			dispatch({type: 'done-gathering'});
			return;
		}

		gatherEventState();
	}, []);

	const callGetUser = useSubscribeCall('WokeToken', 'getUser', account);
	const callUserClaimed = useSubscribeCall('WokeToken', 'userClaimed', props.userId);

	useEffect(() => {
		if(callUserClaimed == true) {
			dispatch({type: 'already-claimed'});
		}
	}, [claimState.stage, claimState.gathering, callUserClaimed])

	useEffect(() => {
		const gatherContractState = () => {
			switch (callGetUser) {
				case '': {
					// Account has no user: User does not exist
					switch(callUserClaimed) {
						case false: {
							// User ID not yet claimed
							dispatch({type: 'contract-call', payload: 'unclaimed'});
							break;
						}
						case true: {
							// Another wallet has claimed this ID
							dispatch({type: 'contract-call', err: 'User ID already claimed'});
							break;
						}

						default: {
							// No result from call
							logVerbose('waiting for userClaimed(id) call');
						}
					}
					break;
				}

				case undefined: {
					// No result from call
					logVerbose('waiting for getUser(account) call');
					break;
				}

				default: {
					// Account has a userId claimed
					if(typeof callGetUser == 'string' && callGetUser.length > 0) {
						if(callGetUser === props.userId) {
							// Correct user is already claimed
							dispatch({type: 'contract-call', payload: 'claimed'});
						} else {
							// Collision: this should never happen
							dispatch({type: 'contract-call', err: 'User ID and account mismatch'});
						}
					}
					break;
				}
			}
		}

		gatherContractState();
	}, [callGetUser, callUserClaimed, props.userId]);

	const tweetText = useSubscribeCall('TwitterOracleMock', 'getTweetText', props.userId);

	useEffect(() => {
		console.log('Got tweet from contract: ', tweetText);
		if(typeof tweetText == 'string' && tweetText != '') {
			//dispatch({type: 'web3-event', name: 'TweetStored'});
			dispatch({type: 'already-stored', name: 'TweetStored'});
		}
	}, [tweetText, claimState.stage == states.LODGED, claimState.gathering])

	// 2. Gather claim-tweet status 
	const [claimString, setClaimString] = useState(null);

	function userClickedPostTweet() {
		dispatch({type: 'twitter-event', name: 'tweetbutton-clicked'});
	}

	function userConfirmedTweeted() {
		dispatch({type: 'already-tweeted'});
	}

	useEffect(() => {
		const generateClaimString = async () => {
			const str = await genClaimString(web3, account, props.userId);
			setClaimString(str);
		}
		generateClaimString();
	}, [web3, claimState.gathering, account, props.userId])

	const timeoutPromise = (ms) => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, ms);
		})
	}

	// Search for claim string
	const [fetchingTweet, setFetchingTweet] = useState(false);
	useEffect(() => {
		const waitForTweet = async (userId) => {
			logVerbose('Searching for ', claimString);
			let tweet = null
			let count = 0;

			// Search for the tweet once initially, then until found
			const maxAttempts = claimState.stage < states.TWEETED ? 1 : 3;

			logVerbose(`\tsearching for claim tweet with ${maxAttempts} attempts`);
			while (!tweet && count < maxAttempts) {
				try {
					await timeoutPromise(1000)
					tweet = await findClaimTweet(twitterClient, userId, '0xWOKE');

				} catch (error) {
					count += 1;
					logVerbose(`Could not find claim tweet on attempt ${count}`);
					logVerbose(error);
				}
			}

			if(isMounted) {
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
		}

		if(!fetchingTweet && claimString != null && claimState.stage < states.FOUND_TWEET) {
			setFetchingTweet(true);
			waitForTweet(props.userId);
			setFetchingTweet(false);
		}

	}, [claimString, claimState.stage == states.CONFIRMED, twitterClient])


	const events = {TweetStored: [], Claimed: [], Lodged: []};

	// 2. Monitor state from events
	events.Claimed = useEvents('WokeToken', 'Claimed',
		useMemo(() => (
			{
				filter: { account: account},
				fromBlock: 0
			}
		),
			[account])
	);

	useEffect(() => {
		if(events.Claimed && events.Claimed.length > 0) {
			dispatch({type: 'web3-event', name: 'Claimed'});
		}
	}, [claimState.gathering, events.Claimed]) //events.Claimed && events.Claimed.length]);

	events.TweetStored = useEvents('TwitterOracleMock', 'TweetStored',
		useMemo(() => (
			{
				filter: { queryId: claimState.queryId },
				fromBlock: 0
			}
		),
			[claimState.queryId])
	);

	useEffect(() => {
		if(claimState.queryId != null && events.TweetStored && events.TweetStored.length > 0) {

			let event = events.TweetStored[events.TweetStored.length - 1].returnValues;
			dispatch({type: 'web3-event', name: 'TweetStored', payload: event});
		}
	}, [claimState.gathering, claimState.queryId, events.TweetStored]); // && events.TweetStored.length]);

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
			dispatch({type: 'web3-event', name:'Lodged', payload: event});
		}
	}, [claimState.gathering, events.Lodged]); // && events.Lodged.length]);

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
			console.log(`sendClaimUser(${props.userId})`)
			dispatch({type: 'sent-transaction', payload: 'claim'})
		} else {
			console.error('Failed to sendClaimUser');
		}
	}

	const handleSendFulfillClaim = () => {
		if(!hasEnoughEth) {
			return;
		}

		sendFulfillClaim.send(props.userId);
		console.dir(sendFulfillClaim);
		console.log(`sendFulfillClaim(${props.userId})`)
		dispatch({type: 'sent-transaction', payload: 'fulfill'})
	}

	useEffect(() => {
		if(claimState.stage == states.STORED_TWEET && !claimState.gathering) {
			handleSendFulfillClaim();
		}
	}, [claimState.stage == states.STORED_TWEET, claimState.gathering])

	useEffect(() => {
		if(claimState.stage == states.FOUND_TWEET && !claimState.gathering) {
			handleSendClaimUser(props.userId, props.userHandle);
		}
	}, [claimState.stage == states.FOUND_TWEET, claimState.gathering])

	// Monitor transaction states
	useEffect(() => {
		console.log(`sendClaimUser.status: ${sendClaimUser.status}`);
	}, [sendClaimUser.status])

	// Log once
	useEffect(() => {
		console.log('Claim account: ', account);
	}, [])

	useEffect(() => {
		console.log(`Claim stage changed: ${claimState.stage}, ${statesList[claimState.stage]}`);
	}, [claimState.stage])

	return {
		submitClaim: handleSendClaimUser, 
		stage: claimState.stage, 
		stageList: statesList,
		stageMap: statesMap,
		stageTriggers: {
			userClickedPostTweet,
			userConfirmedTweeted
		},
		claimString,
		transactions: {
			sendClaimUser,
			sendFulfillClaim
		},
		error
	};
}

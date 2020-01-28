import React, { useState, useEffect } from 'react';
import { useWeb3Context } from '../web3context';


const statesList = [
	'UNCLAIMED',
	'USER_ALREADY_CLAIMED',
	'ACCOUNT_ALREADY_CLAIMED',
	'CLAIMED',
];
export const states = {};
statesList.forEach((state,i) => states[state] = i);

export default function useClaimStatus(userId) {
	if(!userId) {
		console.warn('Claim status must receive userId');
	}
	const {
		useSubscribeCall,
	} = useWeb3Context();
	const callMyUser = useSubscribeCall('WokeToken', 'myUser');
	const callUserClaimed = useSubscribeCall('WokeToken', 'userClaimed', userId);
	const [state, setState] = useState(null);

	useEffect(() => {
		if(userId) {
			switch(callUserClaimed) {
				case false: {
					setState(states.UNCLAIMED);
					break;
				}

				case true: {
					// UserId is claimed
					switch(callMyUser) {
						case '': {
							// No User
							// This user was claimed by a different address
							setState(states.USER_ALREADY_CLAIMED);
							break;
						}

						case undefined: {
							// Wait for result
							break;
						};

						case userId: {
							setState(states.CLAIMED);
							break;
						}

						default: {
							// This address already claimed a different userId
							if(callMyUser && callMyUser.length && callMyUser.length > 0) {
								setState(states.ACCOUNT_ALREADY_CLAIMED)
							}
							break;
						}

					}
					break;
				}

				default: {
					// Waiting for result from userIsClaimed
					switch(callMyUser) {
						case '': {
							// No User
							// Okay
							break;
						}

						case undefined: {
							// Wait for result
							break;
						};

						case userId: {
							setState(states.CLAIMED);
							break;
						}

						default: {
							// Some user ID
							// This address already claimed a different userId
							if(callMyUser && callMyUser.length && callMyUser.length > 0) {
								setState(states.ACCOUNT_ALREADY_CLAIMED);
							}
						}

					}
				}
			}
		}
	}, [callUserClaimed, callMyUser, userId]);

	useEffect(() => {
		console.log('Claim status: ', state);
	}, [state]);

	return state;
}


import React, {useReducer} from 'react'

const routerState = [
	'TWITTER',
	'HEDGEHOG',
	'LOGIN',
	'AUTHD',
]

export const states = {
	TWITTER: routerState[0],
	HEDGEHOG: routerState[1],
	LOGIN: routerState[2],
	AUTHD: routerState[3],
}

export default initialState => {

	const routerReducer = (state, action) => {
		switch (action.type) {
			case 'twitter-authenticated': {
				console.log('Case: twitter-authd');
				switch(state) {
					case states.TWITTER: {
						return states.HEDGEHOG;
					}
					default: {
						return state;
					}
				}
				break;
			}

			case 'hedgehog-account_exists': {
				console.log('Case: hedgehog-account_exists');
				switch(state) {
					case states.TWITTER: {
						console.log('return state LOGIN');
						return states.LOGIN;
					}

					case states.HEDGEHOG: {
						return states.LOGIN;
					}

					default: {
						return state;
					}
				}
				break;
			}

			case 'hedgehog-authenticated': {
				console.log('Case: hedgehog-authd');
				switch(state) {
					case states.HEDGEHOG: {
						return states.AUTHD;
					}
					case states.LOGIN: {
						return states.AUTHD;
					}

					default: {
						return state;
					}
				}
				break;
			}

			default: {
				console.warn('authentication router: invalid action', action);
			}
		}
	}

	initialState = initialState || states.INIT;

	const [router, dispatchRouter] = useReducer(routerReducer, initialState);

	return {
		state: router,
		dispatch: dispatchRouter,
	};

}

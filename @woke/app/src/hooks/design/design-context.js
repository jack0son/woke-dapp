import React, {
	useContext,
	useMemo,
	createContext,
	useState,
	useReducer,
} from 'react';

const Context = createContext();
export const useDesignContext = () => useContext(Context);

const debug = (...args) => console.log('context:design: ', ...args);

function reduceDomains(state, action) {
	switch(action.type) {
		case 'register': {
			const { name, options, select } = action.payload;
			const domains = { ...state.domains, [name]: { options, select } };
			debug(`registered ${name}`);
			return { ...state, domains };
		}

		case 'deregister': {
			const { name } = action.payload;
			if(!name) {
				debug(`No design domain provided`);
				break;
			}
			const domain = state.domains[name];
			if(!domain) {
				throw new Error(`${name} is not a registered design domain`);
			}

			return { ...state, domains: { ...state.domains, [name]: null } };
		}

		default: {
			debug(`Don't recognize message type ${action.type}`);
			return state;
		}
	}

	return state;
}

export function DesignContextProvider({children}) {
	const [domains, dispatch] = useReducer(reduceDomains, { domains: {} });

	const registerDomain = ({name, options, select}) => {
		dispatch({type: 'register', payload: { name, options, select }});
	}

	const deregisterDomain = (name) => {
		dispatch({type: 'deregister', payload: { name }});
	}

	return (
		<Context.Provider
			value={useMemo(() => ({
				domains: domains.domains,
				registerDomain,
				deregisterDomain,
			}),
				[
					domains,
					registerDomain,
					deregisterDomain,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
			//{props && props.children ? props.children : null}

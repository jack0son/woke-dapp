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

// Contract: domain is registered in design context
function _domainIsRegistered(state, name) {
	if(!name) {
		debug(`No design domain provided`);
		throw new Error(`No design domain provided`);
	}
	const domain = state[name];
	if(!domain) {
		throw new Error(`${name} is not a registered design domain`);
	}
}

function reduceDomains(state, action) {
	switch(action.type) {
		case 'register': {
			const { name, ...stageState } = action.payload;
			const domain = { ...action.payload };
			debug(`registered ${name}`);
			return { ...state, [name]: domain };
		}

		case 'update': {
			const { name, stageIndex } = action.payload;
			_domainIsRegistered(state, name);
			return { ...state, [name]: { ...state[name], stageIndex } };
		}

		case 'deregister': {
			const { name } = action.payload;
			_domainIsRegistered(state, name);
			return { ...state, [name]: null };
		}

		default: {
			debug(`Don't recognize message type ${action.type}`);
			return state;
		}
	}

	return state;
}

export function DesignContextProvider({children}) {
	const [domains, dispatch] = useReducer(reduceDomains, {});

	const registerDomain = (domainBundle) => {
		dispatch({ type: 'register', payload: domainBundle });
	}

	const deregisterDomain = (name) => {
		dispatch({ type: 'deregister', payload: { name }});
	}

	const updateDomain = (name, stageIndex) => {
		dispatch({ type: 'update', payload: { name, stageIndex } });
	}

	return (
		<Context.Provider
			value={useMemo(() => ({
				domains,
				registerDomain,
				deregisterDomain,
				updateDomain,
			}),
				[
					domains,
					registerDomain,
					deregisterDomain,
					updateDomain,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
			//{props && props.children ? props.children : null}

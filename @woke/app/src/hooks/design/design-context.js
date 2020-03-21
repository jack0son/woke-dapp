import React, {
	useContext,
	useMemo,
	createContext,
	useState,
	useReducer,
	useEffect,
} from 'react';
import { makeObjectCache } from '../../lib/utils';

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
			const { name, ...stageState } = action.domain;
			const domain = { ...stageState };
			debug(`registered ${name}`);
			return { ...state, [name]: domain };
		}

		case 'update': {
			const { name, stageIndex } = action;
			_domainIsRegistered(state, name);
			return { ...state, [name]: { ...state[name], stageIndex } };
		}

		case 'deregister': {
			const { name } = action;
			_domainIsRegistered(state, name);
			return { ...state, [name]: null };
		}

		case 'restore': {
			const { domains } = action;
			return { ...state, ...domains };
		}

		default: {
			debug(`Don't recognize message type ${action.type}`);
			return state;
		}
	}

	return state;
}

const cache = makeObjectCache('design_mode');
export function DesignContextProvider({children}) {
	const [domains, dispatch] = useReducer(reduceDomains, () => {
		const stored = cache.retrieve()
		return stored && stored.domains || {};
	});

	const [save, setSave] = useState(() => {
		const stored = cache.retrieve()
		return stored && stored.save || false;
	});

	function mapDomains(domains) {
		const r = {};
		Object.keys(domains).forEach(name => {
			if(domains[name] && domains[name].stageIndex) {
				r[name] = {
					stageIndex: domains[name].stageIndex,
				};
			}
		});
		return r;
	}

	useEffect(() => {
		const storedDomains = cache.retrieve().domains; // prevented unregistered domain from being clobbered
		cache.store({
			save,
			domains: save ? { ...storedDomains, ...mapDomains(domains) } : {},
		})
	}, [save, domains])

	const registerDomain = (domainBundle) => {
		dispatch({ type: 'register',  domain: domainBundle });
	}

	const deregisterDomain = (name) => {
		dispatch({ type: 'deregister', name });
	}

	const updateDomain = (name, stageIndex) => {
		dispatch({ type: 'update', name, stageIndex });
	}

	const restore = domains => dispatch({ type: 'restore', domains })	

	return (
		<Context.Provider
			value={useMemo(() => ({
				save,
				setSave,
				domains,
				registerDomain,
				deregisterDomain,
				updateDomain,
			}),
				[
					save,
					setSave,
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

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
}

// When true, don't discard the stage a previously active domain was in
// i.e. when moving from auth to claim, forget we were in the loading stage
// and go back to the signin stage when returning to auth domain.
const PRESERVE_FINISHED_DOMAINS = true;
export const config = { PRESERVE_FINISHED_DOMAINS };

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

	const [overlay, setOverlay] = useState(() => {
		const stored = cache.retrieve()
		return stored && stored.overlay || false;
	})

	function mapDomains(domains) {
		const r = {};
		Object.keys(domains).forEach(name => {
			if(domains[name] && Number.isInteger(domains[name].stageIndex)) {
				r[name] = {
					stageIndex: domains[name].stageIndex,
				};
			}
		});
		return r;
	}

	useEffect(() => {
		const saved = cache.retrieve(); // prevented unregistered domain from being clobbered
		const storedDomains = PRESERVE_FINISHED_DOMAINS && saved && saved.domains || {};
		cache.store({
			save,
			overlay,
			domains: save ? { ...storedDomains, ...mapDomains(domains) } : {},
		})
	}, [save, domains, overlay])

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
				overlay,
				setOverlay,
				save,
				setSave,
				domains,
				registerDomain,
				deregisterDomain,
				updateDomain,
			}),
				[
					overlay,
					setOverlay,
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

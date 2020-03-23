import React, { useEffect } from 'react';
import { useDesignContext, config } from './design-context'
import { makeObjectCache } from '../../lib/utils';

const cache = makeObjectCache('design_mode');
export default function useDesignDomain({ domainName, linearStages, stages }, opts) {
	const { registerDomain, deregisterDomain, updateDomain, save} = useDesignContext();
	const stageIndex = linearStages.stage;

	const options = {
		preserve: config.PRESERVE_FINISHED_DOMAINS || true,
		...opts,
	};

	// Pass stage state up to the state selector
	useEffect(() => {
		if(domainName) {
			const domain = {
				name: domainName,
				options: stages.list,
				select: linearStages.select,
				dispatch: linearStages.dispatch,
				stageIndex,
			};

			if(save && options.preserve) { // Restore from save?
				const { domains } = cache.retrieve();
				const saved = domains && domains[domainName];
				if(saved) {
					domain.select(domain.options[saved.stageIndex]);
				}
			}

			registerDomain(domain);

			return () => {
				deregisterDomain(domainName);
			};
		}
	}, [domainName]);

	useEffect(() => {
		if(domainName)  {
			if(domainName == 'root') console.log('UPDATE ROOT DOMAIN');
			updateDomain(domainName, stageIndex)
		}
	}, [stageIndex, domainName])

	return null;
}

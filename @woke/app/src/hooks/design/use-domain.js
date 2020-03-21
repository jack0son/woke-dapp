import React, { useEffect } from 'react';
import { useDesignContext } from './design-context'
import { makeObjectCache } from '../../lib/utils';

const cache = makeObjectCache('design_mode');
export default function useDesignDomain({ domainName, linearStages, stages }) {
	const { registerDomain, deregisterDomain, updateDomain, save} = useDesignContext();
	const stageIndex = linearStages.stage;

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

			if(save) {
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
		if(domainName) 
			updateDomain(domainName, stageIndex)
	}, [stageIndex, domainName])

	return null;
}

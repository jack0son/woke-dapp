import React from 'react'

import { useDesignContext } from '../hooks/design/design-context'
// @todo make selector properly supported by design flow so prop passing here
// can be cleaned up
export default function({ domainName }) {
	const { domains } = useDesignContext();

	const domain = domains[domainName];
	if(!domain) {
		return null;
	}

	const onChange = event => domain.select(event.target.value);

	return (
		<select id={`stageSelector-${domainName}`} onChange={onChange}>
			{
				domain.options.map(i => <option value={i}>{i}</option>)

			}
		</select>
	);
}

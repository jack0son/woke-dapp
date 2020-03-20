import React from 'react'
import { useDesignContext } from '../../hooks/design/design-context'
import StageFlicker from './stage-flicker'

export default function({ domainName }) {
	const { domains } = useDesignContext();

	const domain = domains[domainName];
	if(!domain) return null;

	const onChange = event => domain.select(event.target.value);

	return (
		<>
		<StageFlicker domainName={domainName}/>
		<select id={`stageSelector-${domainName}`} onChange={onChange}>
			{
				domain.options.map(i => <option value={i}>{i}</option>)

			}
		</select>
		</>
	);
}

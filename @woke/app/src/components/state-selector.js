import React from 'react'

import { useRootContext } from '../hooks/root-context'
// @todo make selector properly supported by design flow so prop passing here
// can be cleaned up
export default function(props) {
	const bundle = useRootContext().escapeHatch;
	if(!bundle) {
		return null;
	}
	return (
		<select id='otherState' onChange={bundle.onChange}>
			{
				bundle.items.map(i => <option value={i}>{i}</option>)

			}
		</select>
	);
}

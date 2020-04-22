import React from 'react';
import StandardBody from './body-standard';
import HL from './span-highlight';

export default function RememberPasswordText() {
	// MUI Style Overwrite pattern

	return (
		<StandardBody styles={{
			textAlign: 'justify',
			marginBottom: '10%',
			marginTop: '10%',
			small: {
				marginBottom: '15%',
			}
		}}>
			Your password can <HL>never</HL> be recovered.
			<br/>
			Remember your password. Stay woke.
		</StandardBody>
	);
}

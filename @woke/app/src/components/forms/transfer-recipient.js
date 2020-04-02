import React from 'react';
import TextFieldOutlined from '../fields/text-outlined';


export default function RecipientForm({recipient, handleSetRecipient, ...props }) {

	return (
		<TextFieldOutlined
			controlledValue={recipient}
			handleChange={event => handleSetRecipient(event.target.value)}
			labelText={'Twitter User'}
			{ ...props }
		/>
	);
}

import React from 'react';
import TextFieldOutlined from '../fields/text-outlined';


export default function RecipientForm({recipient, handleSetRecipient, ...props }) {

	return (
		<TextFieldOutlined
			controlledValue={recipient}
			handleChange={handleSetRecipient}
			labelText={'Twitter User'}
			{ ...props }
		/>
	);
}

import React from 'react';

import FlexColumn from '../../layouts/flex-row';

import AmountForm from './tokens-amount'
// import RecipientFrom from './tokens-recipient.js

export default function TransferTokensForm(props) {
	const {
		sendTransfers,				// Transfer API (web3)
		pending,							// Transfer tx status
		suggestions,					// Recipient search typeahead
		usernamePlaceholder,
		amountPlaceholder,
	} = props;


	return (
		<FlexColumn>
			<AmountForm
				balance={1305}
			/>
			{/* <RecipientForm/> */ }
		</FlexColumn>
	);
}

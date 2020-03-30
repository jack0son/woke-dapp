import React, { useState } from 'react';

import FlexColumn from '../../layouts/flex-column';
import FlexRow from '../../layouts/flex-row';

import AmountForm from './transfer-amount';
import RecipientForm from './transfer-recipient';

export default function TransferTokensForm(props) {
	const {
		sendTransfers,				// Transfer API (web3)
		pending,							// Transfer tx status
		suggestions,					// Recipient search typeahead
		usernamePlaceholder,
		amountPlaceholder,
	} = props;

	const [amount, setAmount] = useState(0);
	const [recipient, setRecipient] = useState('twitterHandle');

	const handleSetAmount = (amount) => {
		setAmount(amount);
	};

	return (
		<FlexColumn styles={{
			width: '70%',
			widthSmall: '95%',
			marginLeft: 'auto',
			marginRight: 'auto',
		}}>
			<RecipientForm
				flexGrow={5}
				recipient={recipient}
				handleSetRecipient={setRecipient}
			/>
			<AmountForm
				amount={amount}
				handleSetAmount={handleSetAmount}
				balance={1305}
			/>
		</FlexColumn>
	);
}

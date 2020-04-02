import React, { useState } from 'react';
import Button from '../buttons/button-contained';

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
	const [recipient, setRecipient] = useState(`  ... user's twitter handle goes here`);

	const handleSetAmount = (amount) => {
		setAmount(amount);
	};

	const popModal = () => {
	};

	return (
		<FlexColumn styles={{
			width: '50%',
			minWidth: '25vw',
			//marginLeft: 'auto',
			//marginRight: 'auto',
			small: {
				width: '85%',
			}
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
			<Button
				color='primary'
				text='SEND'
				onClick={popModal}
				styles={{
					marginTop: '5%',
					fontSize: '1.5rem',
					width: '100%',
				}}
			/>
		</FlexColumn>
	);
}

import React, { useState, useEffect } from 'react';
import Button from '../buttons/button-contained';

import FlexColumn from '../../layouts/flex-column';
import FlexRow from '../../layouts/flex-row';

import AmountForm from './transfer-amount';
import RecipientForm from './transfer-recipient';
import ConfirmTransferDialog from './transfer-confirm';

export default function TransferTokensForm({
	balance,
	sendTransfers,				// Transfer API (web3)
	pending,							// Transfer tx status
	suggestions,					// Recipient search typeahead
	usernamePlaceholder,
	amountPlaceholder,
	...props
}) {
	const {
		handleSelectRecipient,
		handleSubmitTransfer,
		handleChangeInput,
		handleClearRecipient,
		recipient,
		amount,
		error,
	} = sendTransfers;

	const defaults = {
		value: 5,
	};

	const defaultAmount = defaults.value < balance ? defaults.value : Math.floor(balance/3)

  const [open, setOpen] = React.useState(false);

	// Check if valid recipient, if so, open confirm dialog
	useEffect(() => {
		if(recipient) {
			openModal();
		}
	}, [recipient])

	const handleClickSend = () => handleSelectRecipient();
  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

	const handleConfirmTransfer = () => {
		handleSubmitTransfer();
		closeModal();
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
				handleChange={handleChangeInput('screen_name')}
				handleSelectRecipient={handleSelectRecipient}
				suggestions={suggestions}
				placeholder={usernamePlaceholder}
				error={error}
				//handleChange={handleChangeInput('screen_name')}
			/>
			<AmountForm
				amount={amount}
				handleSetAmount={handleChangeInput('amount')}
				balance={balance}
			/>
			<Button
				color='primary'
				text='SEND'
				onClick={handleClickSend}
				styles={{
					marginTop: '5%',
					fontSize: '1.5rem',
					width: '100%',
				}}
			/>
			<ConfirmTransferDialog
				open={open}
				onConfirm={handleConfirmTransfer}
				onCancel={closeModal}
				handleClose={closeModal}
				amount={amount}
				recipient={recipient}
			/>
		</FlexColumn>
	);
}

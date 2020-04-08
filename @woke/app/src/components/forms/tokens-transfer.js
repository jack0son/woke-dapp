import React, { useState } from 'react';
import Button from '../buttons/button-contained';

import FlexColumn from '../../layouts/flex-column';
import FlexRow from '../../layouts/flex-row';

import AmountForm from './transfer-amount';
import SearchField from '../fields/search';
import RecipientForm from './transfer-recipient';
import ConfirmTransferDialog from './transfer-confirm';

export default function TransferTokensForm({ balance, ...props }) {
	const {
		sendTransfers,				// Transfer API (web3)
		pending,							// Transfer tx status
		suggestions,					// Recipient search typeahead
		usernamePlaceholder,
		amountPlaceholder,
	} = props;

	const {
		handleSelectRecipient,
		handleSubmitTransfer,
		handleChangeInput,
		handleClearRecipient,
		recipient,
		error,
	} = sendTransfers;

	const defaults = {
		value: 5,
	};

	const defaultAmount = defaults.value < balance ? defaults.value : Math.floor(balance/3)
	const [amount, setAmount] = useState(defaultAmount);

	const handleSetAmount = (amount) => {
		setAmount(amount);
	};

  const [open, setOpen] = React.useState(false);

  const openModal = () => {
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
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
				//handleChange={handleChangeInput('screen_name')}
			/>
			<AmountForm
				amount={amount}
				handleSetAmount={handleSetAmount}
				balance={1305}
			/>
			<Button
				color='primary'
				text='SEND'
				onClick={openModal}
				styles={{
					marginTop: '5%',
					fontSize: '1.5rem',
					width: '100%',
				}}
			/>
			<ConfirmTransferDialog
				open={open}
				handleClose={closeModal}
				amount={amount}
				recipient={recipient}
			/>
		</FlexColumn>
	);
}

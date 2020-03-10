import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Box from '@material-ui/core/Box';
import Fab from '@material-ui/core/Fab';
import CloseIcon from '@material-ui/icons/CloseRounded';

import FieldWrapper from '../../layouts/wrapper-field';

import SearchField from  '../fields/search';
import AmountField from  '../fields/amount';
import Button from '../buttons/button-contained';
import StandardBody from '../text/body-standard';
import Spinner from '../progress/spinner-indeterminate';

const useStyles = makeStyles(theme => ({
	centeredForm: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: 'auto',
		marginTop: 0,
	},

	cancelButton: {
	}

}));

export default function SendTransferForm (props) {
	const classes = useStyles();
	const theme = useTheme();

	const {
		sendTransfers,
		onClick,
		usernamePlaceholder,
		amountPlaceholder,
		suggestions,
		pending,
	} = props;

	const {
		handleSelectRecipient,
		handleSubmitTransfer,
		handleChangeInput,
		handleClearRecipient,
		recipient,
		error,
	} = sendTransfers;

	// If recipient chosen
	const buttonProps = recipient ? {
		color: 'primary',
		text: 'confirm',
		onClick: handleSubmitTransfer,
	} : {
		color: 'primary',
		text: 'send',
		onClick: handleSelectRecipient,
	}

	const renderForm = () => (
		<>
				<div
					className={classes.centeredForm}
				>
					{ recipient ? (
						<>
						<AmountField
							//placeholder={props.amountPlaceholder}
							onChange={handleChangeInput('amount')}
						/>
						<StandardBody 
							style={{
								paddingLeft:theme.spacing(2),
								paddingTop: theme.spacing(1)
							}}
							align='left'
						>
							@{recipient.handle}
						</StandardBody>
						</>
					) : (
							<SearchField 
								suggestions={suggestions}
								placeholder={usernamePlaceholder}
								handleChange={handleChangeInput('screen_name')}
							/>
						)
					}
					<Button 
						styles={{
							alignText: 'center',
							position: 'relative',
							justifySelf: recipient ? 'flex-end' : 'flex-start',
							marginRight: 0,
							//maxWidth: '100px',
							maxWidth: '100px',
							minWidth: 'auto',
							paddingLeft: theme.spacing(1),
							paddingRight: theme.spacing(1),
							paddingTop: theme.spacing(0),
							paddingBottom: theme.spacing(0),
						}}
						{...buttonProps} 
					/>
				</div>
				{ recipient ? (
							<Fab 
								size="small" 
								color="secondary" 
								aria-label="cancel" 
								onClick={handleClearRecipient}
								className={classes.cancelButton}
								style={{
									backgroundColor: theme.palette.background.dark
								}}
							>
							<CloseIcon/>
						</Fab>
				): (null)}
		</>
	);

	let enableForm = error && error.action && error.action == 'disable' ? false : true;


	return (
		<FieldWrapper align='center' styles={{paddingTop: recipient ? 0 : '16px'}}>
			{ enableForm ? (pending ? <Spinner/> : renderForm()) : <><br/><br/></>}
			<StandardBody color='error'>{error && error.message ? error.message : error}</StandardBody>
		</FieldWrapper>
	);
}

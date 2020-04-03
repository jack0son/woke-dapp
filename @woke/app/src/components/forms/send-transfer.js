import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Box from '@material-ui/core/Box';
import Fab from '@material-ui/core/Fab';
import CloseIcon from '@material-ui/icons/CloseRounded';

import FlexColumn from '../../layouts/flex-column';
import FlexRow from '../../layouts/flex-row';

import SearchField from  '../fields/search';
import AmountField from  '../fields/amount';
import Button from '../buttons/button-contained';
import StandardBody from '../text/body-standard';
import Spinner from '../progress/spinner-indeterminate';

const useStyles = makeStyles(theme => ({
	centeredForm: {
		width: '80%',
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		//width: 'auto',
		//marginTop: 0,
		[theme.breakpoints.down('sm')]: {
			width: '95%',
		},
	},

	cancelButton: {
	}

}));

export default function SendTransferForm (props) {
	const { order } = props;
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

	const renderChooseAmount = () => (<>
		<AmountField
			flexGrow={3}
			//placeholder={props.amountPlaceholder}
			onChange={handleChangeInput('amount')}
		/>
			<StandardBody 
				style={{
					justifySelf: 'center',
					paddingLeft:theme.spacing(2),
					paddingTop: theme.spacing(1)
				}}
				align='left'
			>
				@{recipient.handle}
			</StandardBody>
	</>);

	const renderChooseRecipient = () => (<>
		<SearchField 
			suggestions={suggestions}
			placeholder={usernamePlaceholder}
			handleChange={handleChangeInput('screen_name')}
		/>
	</>)

	const renderForm = () => (
		<>
			<div className={classes.centeredForm} order={order}>
					{ recipient ? 
							renderChooseAmount() :
							renderChooseRecipient()
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
			<FlexColumn
				styles={{
					alignSelf: 'center',
					width: '80%',
					maxWidth: '100%',
					maxHeight: '70%',
					justifyContent: 'space-between',
					alignItems: 'center',
					paddingTop: recipient ? 0 : '16px'
				}}
			>
				{ enableForm ? (pending ? <Spinner/> : renderForm()) : <><br/><br/></>}
				<StandardBody color='error'>{error && error.message ? error.message : error}</StandardBody>
			</FlexColumn>
	);
}

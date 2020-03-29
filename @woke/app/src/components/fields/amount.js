import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';

const useStyles = makeStyles(theme => ({
	amountField: {
		minWidth: '200px',
		width: '40%',
	},

	inputLabel: {
		color: theme.palette.primary.main.contrastText,
		textOpacity: 70,
	}
}));

export default function AmountField(props) {
	const classes = useStyles();
	const {type, ...innerProps} = props;

	let passwordProps = {}
	switch (props.type) {
		case 'confirmation': {
			passwordProps = {
				id: 'standard-password-confirmation-input',
				label: 're-enter password',
			}
			break;
		}

		case 'password': {
			// fall through
		}

		default: {
			passwordProps = {
				id: 'standard-password-input',
				label: 'password',
			}
		}
	}

	const renderAdornment = () => (
		<InputAdornment position="end">W</InputAdornment>
	)

	// TODO fix autocomplete
	return (
			<TextField
				id="standard"
				label="Enter amount to send"
				InputLabelProps={{
					className: classes.inputLabel
				}}
				InputProps={{
					style: {
						//marginTop: 8,
					},
					//margin: 'dense',
					endAdornment: renderAdornment(),
					inputProps: {
						min: 0,
						max: props.maxAmount ? props.maxAmount : 1000000000
					}
				}}
				className={classes.amountField}
				variant="standard"
				type="number"
				{...innerProps}
			/>
	);
}

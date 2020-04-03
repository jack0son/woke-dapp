import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles(theme => ({
	passwordField: {
		fontSize: '3rem',
		width: '100%',
		flexGrow: 1,
	},

	underline: {
		'&:before': {
			borderBottomColor: theme.palette.secondary.main,
		},

		'&:after': {
			//borderBottomColor: theme.palette.secondary.main,
		}
	}
}));

export default function PasswordField(props) {
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

	// TODO fix autocomplete
	return (
		<TextField
			id={passwordProps.id}
			label={passwordProps.label}
			className={classes.passwordField}
			InputProps={{
				classes: { underline: classes.underline }
			}}
			type="password"
			autoComplete="current-password"
			margin="normal"
			variant="standard"
			{...innerProps}
		/>
	);
}

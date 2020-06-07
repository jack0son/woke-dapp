import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Box from '@material-ui/core/Box';

import FieldWrapper from '../../layouts/wrapper-field';
import Password from '../fields/password'
import Button from '../buttons/button-contained'
import StandardBody from '../text/body-standard'
import { registerEnterKey } from '../../lib/utils';

const useStyles = makeStyles(theme => ({
	centeredForm: {
		// Layout
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignItems: 'center',

		// Size
		width: '100%',
		//minHeight: '100%',
		//marginTop: 'auto',

		// Spacing
		//paddingLeft: theme.spacing(3),
		//paddingRight: theme.spacing(3),
	},

	inputs: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
		width: '100%',
		alignItems: 'stretch',
		marginBottom: '10%',
	}
}));

const MIN_PASSWORD_LENGTH = 6;
export default function NewPassword (props) {
	const classes = useStyles();
	const theme = useTheme();

	const {onClick, ...buttonProps} = props.buttonProps;

	const [input, setInput] = useState({
		password: '',
		confirmation: '',
	});
	const [error, setError] = useState({password: null, confirmation: null});

	const handleChangeInput = name => event => {
		setInput({ ...input, [name]: event.target.value });
	};

	React.useEffect(() => {
		if(input.password.length < MIN_PASSWORD_LENGTH && input.confirmation.length > 0) {
			setError(error => ({ ...error, password: 'Password must be longer than 6 characters'}));
		} else {
			setError(error => ({ ...error, password: null}));
		}

		if(input.confirmation !== input.password && input.confirmation.length > 0) {
			setError(error => ({ ...error, confirmation: 'Passwords do not match'}));
		} else {
			setError(error => ({ ...error, confirmation: null }));
		}
	}, [input.password, input.confirmation]);

	const setPassword = () => {
		props.triggerSetPassword(input.password, input.confirmation);
	}

	registerEnterKey(setPassword);

	return (
//		<FieldWrapper>
			<Box
				className={classes.centeredForm}
			>
				<div className={classes.inputs}>
					<Password 
						type={'password'}
						value={input.password}
						onChange={handleChangeInput('password')}
						error={error.password}
						helperText={error.password}
					/>
					<Password 
						type={'confirmation'}
						value={input.confirmation}
						onChange={handleChangeInput('confirmation')}
						error={error.confirmation}
						helperText={error.confirmation}
					/>
				</div>
				<Button 
					disabled={error.password || error.confirmation || !input.confirmation.length}
					onClick={setPassword}
					styles={{marginTop: theme.spacing(2), marginBottom: theme.spacing(2)}}
					{...buttonProps}
				>
					{props.buttonText}
				</Button>
				<StandardBody align='center' color='error'>
					{props.errorMessage}
				</StandardBody>
			</Box>
//		</FieldWrapper>
	);
}

import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Box from '@material-ui/core/Box';

import FieldWrapper from '../../layouts/wrapper-field';

import Password from '../fields/password'
import Button from '../buttons/button-contained'
import StandardBody from '../text/body-standard'

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

export default function NewPassword (props) {
	const classes = useStyles();
	const theme = useTheme();

	const {onClick, ...buttonProps} = props.buttonProps;

	const [input, setInput] = useState({
		password: '',
		confirmation: '',
	});

	const handleChangeInput = name => event => {
		setInput({ ...input, [name]: event.target.value });
	};


	const setPassword = () => {
		props.triggerSetPassword(input.password, input.confirmation);
	}

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
					/>
					<Password 
						type={'confirmation'}
						value={input.confirmation}
						onChange={handleChangeInput('confirmation')}
					/>
				</div>
				<Button 
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

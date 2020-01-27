import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Box from '@material-ui/core/Box';

import FieldWrapper from '../../layouts/wrapper-field';

import Password from '../fields/password'
import Button from '../buttons/button-contained'
import StandardBody from '../text/body-standard'

const useStyles = makeStyles(theme => ({
	centeredForm: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		bottom: 0,
		width: 'auto',
		marginTop: 'auto',
		paddingLeft: theme.spacing(3),
		paddingRight: theme.spacing(3),
	}
}));

export default function EnterPassword (props) {
	const classes = useStyles();
	const theme = useTheme();

	const {onClick, styles, ...buttonProps} = props.buttonProps;

	const [input, setInput] = useState({
		password: '',
		confirmation: '',
	});

	const handleChangeInput = name => event => {
		setInput({ ...input, [name]: event.target.value });
	};

	const triggerLogin = () => {
		props.triggerLogin(input.password);
	}

	return (
		<FieldWrapper styles={styles}>
			<Box
				className={classes.centeredForm}
			>
				<Password type={'password'}/>
				<Button 
					type={'password'}
					value={input.password}
					onChange={handleChangeInput('password')}
					onClick={triggerLogin}
					styles={{
						marginTop: theme.spacing(4),
						marginBottom: theme.spacing(2)
					}}
					{...buttonProps}
				>
					{props.buttonText}
				</Button>
				<StandardBody align='center' color='error'>
					{props.errorMessage}
				</StandardBody>
			</Box>
		</FieldWrapper>
	);
}

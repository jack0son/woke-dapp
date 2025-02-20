import React, { useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';

import FlexColumn from '../../layouts/flex-column';

import Password from '../fields/password'
import Button from '../buttons/button-contained'
import StandardBody from '../text/body-standard'

import { useEnterKey } from '../../hooks/util-hooks';

const useStyles = makeStyles(theme => ({
	centeredForm: styles => ({
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: 'auto',
		marginTop: 'auto',
		...styles,
	})
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
	useEnterKey(triggerLogin);

	return (
		<FlexColumn styles={{
			justifyContent: 'space-around',
			width: '100%',
			height: '30%',
			small: {
				justifyContent: 'space-around',
				height: '40%',
			}
		}}>
			<Password
				type={'password'}
				value={input.password}
				onChange={handleChangeInput('password')}
			/>
			<Button 
				onClick={triggerLogin}
				styles={{
				}}
				{...buttonProps}
			>
				{props.buttonText}
			</Button>
			<StandardBody align='center' color='error'>
				{props.errorMessage}
			</StandardBody>
		</FlexColumn>
	);
}

import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import Input from '@material-ui/core/Input';
import FilledInput from '@material-ui/core/FilledInput';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles((theme) => ({
	root: {
		display: 'flex',
		flexWrap: 'wrap',
	},
	margin: {
		margin: theme.spacing(1),
	},
	withoutLabel: {
		marginTop: theme.spacing(3),
	},

	notchedOutlineDisabled: {
		//border: '4px solid',
		borderColor: theme.palette.background.default,
		borderWidth: '2px',

		focused: {
			borderWidth: '5px',
		}
	},

	input: {
		width: '100%',
		backgroundColor: theme.palette.background.default,
	},

	// @fix move to global theme
	overrides: {
		MuiOutlinedInput: {
			root: {
				'&:hover:not($disabled):not($focused):not($error) $notchedOutline': {
					borderColor: 'rgba(0,0,0,0.4)',
				},
			},
		},
	},

	textField: {
		flexGrow: 1,
		//minWidth: '8ch',
	},
}));

export default function TextFieldOutlined({ controlledValue, handleChange, ...props }) {
	const defaults = {error: false, errorText: 'error', labelText: 'Text'};
	const { styles, labelText, error, errorText, ...other } = { ...defaults, ...props }
	const classes = useStyles(styles);

	return (
		<TextField fullWidth
			label="Twitter User"
			variant="outlined"
			defaultValue='users twitter handle'
			className={classes.input}
			value={controlledValue}
			onChange={handleChange}
			id="outlined-adornment-amount"
			InputProps={{
				startAdornment: <InputAdornment position="start">Search</InputAdornment>
			}}
			error={error}
			//helperText={ error ? errorText : null }
			//labelWidth={60}
			{ ...other }
		/>
	);
}

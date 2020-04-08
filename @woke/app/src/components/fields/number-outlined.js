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
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },

	input: {
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
    margin: theme.spacing(1),
		marginLeft: 0,
		flexGrow: 1,
		//maxWidth: '40%',
    minWidth: '50px',
  },
}));

export default function NumberFieldOutlined({ controlledValue, handleChange, ...props }) {
	const defaults = { unitSymbol: '$' };
	const { styles, unitSymbol, labelText, ...other } = { ...defaults, ...props }
	const classes = useStyles(styles);

	return (
		<TextField fullWidth type="number"
			label={labelText || "Number"}
			variant="outlined"
			defaultValue='users twitter handle'
			className={classes.input}
			value={controlledValue}
			onChange={handleChange}
			id="outlined-adornment-amount"
			InputLabelProps={{ style: { zIndex: '0' } }}
			zIndex={'-10000'}
			InputProps={{
				startAdornment: <InputAdornment position="start">{unitSymbol}</InputAdornment>
			}}
			//error={error}
			//classes={{ notchedOutline: classes.notchedOutline }}
			//helperText={ error ? errorText : null }
			//labelWidth={60}
			{ ...other }
		/>
	);
}

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },

	input: {
		'& > div': {
			backgroundColor: theme.palette.background.default,
		}
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
			InputLabelProps={{ style: { zIndex: '1' } }}
			InputProps={{
				startAdornment: <InputAdornment position="start">{unitSymbol}</InputAdornment>
			}}
			{ ...other }
		/>
	);
}

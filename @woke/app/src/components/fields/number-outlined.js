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
  margin: {
    margin: theme.spacing(1),
  },
  withoutLabel: {
    marginTop: theme.spacing(3),
  },

	notchedOutline: {
		//border: '4px solid',
		borderColor: theme.palette.background.default,
		borderWidth: '2px',

		focused: {
			borderWidth: '5px',
		}
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
    width: '25ch',
  },
}));

export default function NumberFieldOutlined(props) {
	const { controlValue } = props;
 const classes = useStyles();
	const [values, setValues] = React.useState({
    amount: '',
    password: '',
    weight: '',
    weightRange: '',
    showPassword: false,
  });

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value });
  };

	const renderAmountField = () => (
			<FormControl fullWidth className={classes.margin} variant="outlined">
				<InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
				<OutlinedInput
					value={controlValue}
					className={classes.input}
					classes={{ notchedOutline: classes.notchedOutline }}
					id="outlined-adornment-amount"
					value={values.amount}
					onChange={handleChange('amount')}
					startAdornment={<InputAdornment position="start">$</InputAdornment>}
					labelWidth={60}
				/>
			</FormControl>
	);

	const renderWithLabel = () => (
			<TextField
				color="primary"
				label="amount"
				id="outlined-start-adornment"
				className={clsx(classes.margin, classes.textField)} //, classes.outlined)}
				InputProps={{
					//className: classes.outlined,
					startAdornment: <InputAdornment position="start">W</InputAdornment>,
				}}
				variant="outlined"
				{ ...props }
			/>
	);

	return (<>
		{ renderAmountField() }
		{ renderWithLabel() }
	</>);
}

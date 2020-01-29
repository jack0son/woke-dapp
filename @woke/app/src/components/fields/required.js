import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
//import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles(theme => ({
	amountField: {
		position: 'relative',
		borderRadius: '2px',
		//alignSelf: 'flex-end',
		height: '100%',
		backgroundColor: theme.palette.background.default,//fade(theme.palette.primary.light, 0.5),
		marginLeft: theme.spacing(0.25),
		marginRight: theme.spacing(2),
	},

	inputRoot: {
		color: 'inherit',
		display: 'flex',
		alignSelf: 'flex-end',
		//width: theme.spacing(8),
		//flexGrow: 0,
	},

	inputInput: {
		padding: theme.spacing(1, 1, 1, 1),
		transition: theme.transitions.create(['width']),
		flexGrow: 0,
		fontSize: '14px',

		width: theme.spacing(6),
		'&:focus': {
		}
	}
}));

export default function AmountField(props) {
	const classes = useStyles();
	const {type, ...innerProps} = props;

	// TODO fix autocomplete
	return (
		<div className={classes.amountField}>
		<InputBase
			required
			id="standard-required"
			label={props.label}
			defaultValue={props.amountField}
			classes={{
				root: classes.inputRoot,
				input: classes.inputInput,
			}}
			margin="normal"
			{...innerProps}
		/>
		</div>
	);
}

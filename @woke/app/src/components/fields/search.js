import React from 'react';
import { fade, makeStyles, useTheme } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';

import Typeahead from '../typeahead';
import Avatar from '../../layouts/avatar';

const useStyles = makeStyles(theme => ({
	root: {
		//flexGrow: 1,
		height: theme.spacing(4),
		display: 'flex',
		flexDirection: 'column',
		alignContent: 'center',
		justifyContent: 'center',
	},

	search: {
		position: 'relative',
		borderRadius: '2px',
		alignSelf: 'flex-end',
		height: '100%',
		//width: 'auto',
		backgroundColor: theme.palette.background.default,//fade(theme.palette.primary.light, 0.5),
		'&:hover': {
			//backgroundColor: fade(theme.palette.background.paper, 0.25),
		},
		marginLeft: 0,
		[theme.breakpoints.up('xl')]: {
			marginLeft: theme.spacing(1),
			//width: 'auto',
		},
	},

	searchIcon: {
		height: '100%',
		position: 'absolute',
		pointerEvents: 'none',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		paddingLeft: theme.spacing(1),
		paddingRight: '0px',
	},

	inputRoot: {
		color: 'inherit',
		display: 'flex',
		paddingLeft: theme.spacing(0),
		alignSelf: 'flex-end',
		//width: theme.spacing(8),
		//flexGrow: 0,
	},

	inputInput: {
		padding: theme.spacing(1, 1, 1, 5),
		transition: theme.transitions.create(['width']),
		flexGrow: 0,
		fontSize: '14px',

		width: theme.spacing(9),
		'&:focus': {
				flexGrow: 1,
				width: theme.spacing(16),
		},
	},
}));

export default function SearchField(props) {
	const {placeholder, handleChange, inputProps} = props;
  const classes = useStyles(inputProps);
	const theme = useTheme();

	//onChange({target: 'test'});

	return (
		<div className={classes.root}>
			<div className={classes.search}>
				<div className={classes.searchIcon}>
					<SearchIcon color='primary'/>
				</div>
				<Typeahead
					handleFieldChange={handleChange}
					placeholder={placeholder}
					suggestions={props.suggestions}
					Suggestion={ props => (
						<>
						<Avatar
							alt={props.suggestion.handle}
							src={props.suggestion.avatar}
							styles={{
								height: '28px', 
								width: '28px', 
								borderWidth: '1px',
								borderRadius: '50%',
								marginLeft: theme.spacing(1),
								marginRight: theme.spacing(2)
							}}
						/>
						<>{ props.suggestion.label }</>
						</>
					)}
					FieldComponent={ props => (
						<InputBase
							fullWidth={props.inputProps.value == '' || !props.inputProps.value ? false : true}
							placeholder={placeholder ? placeholder : "Search…"}
							type="search"
							//onChange={onChange}
							classes={{
								root: classes.inputRoot,
								input: classes.inputInput,
							}}
							inputProps={{ 
								'aria-label': 'search',
								style: {
									width: props.inputProps.value == '' || !props.inputProps.value ? undefined : theme.spacing(16),
								},
								...props.inputProps,
							}}
						/>
					)}
				/>
			</div>
		</div>
	);
}

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
	button: styles => ({
		margin: theme.spacing(1),
		display: 'block',
		textTransform: 'lower', // remove capitalization
		//maxWidth: '100px',
		//marginTop: '15%',
		paddingRight: '25px',
		paddingLeft: '25px',
		borderRadius: '2px',
		//backgroundColor: '#46dc9e',
		boxShadow: `1px 1px 5px 0 ${theme.palette.secondary.main}`,
		fontSize: '2rem',
		minHeight: '2rem',
		fontWeight: 700,
		textAlign: 'center',
		whiteSpace: 'nowrap',
		typography: theme.typography,
		[theme.breakpoints.down('sm')]: {
			fontSize: '1rem',
		},
		'& > span': {
			display: 'flex',
			'& > span': {
				'&:nth-child(1)': {
					marginRight: '20px',
				},
				'&:nth-child(2)': {
					marginLeft: '20px',
				},
			},
		},
		...styles
	}),

}));

export default function ContainedButton(props) {
	const {text, styles, color, children, iconLeft, iconRight, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Button
			variant="contained"
			color={color || "primary"}
			className={classes.button}
			startIcon={iconLeft}
			endIcon={iconRight}
			{...innerProps}
		>
			{text}
			{children}
		</Button>
	);
}

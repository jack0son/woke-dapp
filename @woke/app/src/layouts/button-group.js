import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Box from '@material-ui/core/Box';

import BodyStandard from '../components/text/body-standard'
import Button from '../components/buttons/button-contained'


const useStyles = makeStyles(theme => ({
	buttonGroup: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		bottom: 0,
		width: 'auto',
		height: 'auto',
		marginTop: 'auto',
		paddingTop: theme.spacing(2),
		paddingBottom: theme.spacing(2),
	}
}));

export default function ButtonGroup (props) {
	const classes = useStyles();
	const theme = useTheme();

	// Catch prop duplication
	// TODO this is redundant
	const {onClick, ...buttonProps} = props.buttonProps;

	return (
		<Box
			className={classes.buttonGroup}
		>
			<BodyStandard
				styles={{
					paddingLeft: theme.spacing(3),
					paddingRight: theme.spacing(3),
				}}
			>
				{props.message}
			</BodyStandard>

			{ props.Button ? props.Button(buttonProps) : (
				<Button 
					onClick={onClick}
					{...buttonProps}
					styles={{marginTop: '15%'}}
				>
				{props.buttonText}
				</Button>
			)}
		</Box>
	);
}

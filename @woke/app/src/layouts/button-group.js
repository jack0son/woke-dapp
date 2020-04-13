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
		justifyContent: 'space-evenly',
		alignItems: 'center',
		width: 'auto',
		minHeight: '30vh',
		//marginTop: 'auto',
		paddingTop: theme.spacing(2),
		paddingBottom: theme.spacing(2),
	}
}));

export default function ButtonGroup (props) {
	const { reverse } = props;
	const classes = useStyles();
	const theme = useTheme();

	// Catch prop duplication
	// TODO this is redundant
	const {onClick, ...buttonProps} = props.buttonProps;

	const buttonOrder = reverse ? 1 : 3;

	const renderMessage = () => <BodyStandard order={2}
		styles={{
			paddingLeft: theme.spacing(3),
			paddingRight: theme.spacing(3),
		}}
	>
		{props.message}
	</BodyStandard>

	return (
		<Box className={classes.buttonGroup}>
			{ reverse || renderMessage() }
			{ props.Button ? props.Button({ ...buttonProps, order: buttonOrder}) : (
				<Button order={buttonOrder}
					onClick={onClick}
					{...buttonProps}
				>
				{props.buttonText}
				</Button>
			)}
			{ reverse && renderMessage() }
		</Box>
	);
}

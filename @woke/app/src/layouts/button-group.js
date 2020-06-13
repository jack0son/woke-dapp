import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';

import BodyStandard from '../components/text/body-standard'
import Button from '../components/buttons/button-contained'


const useStyles = makeStyles(theme => ({
	buttonGroup: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-around',
		alignItems: 'center',
		width: 'auto',
		minHeight: '30vh',
		marginTop: '10%',
		paddingTop: theme.spacing(2),
		paddingBottom: theme.spacing(2),
	}
}));

export default function ButtonGroup (props) {
	const { reverse, Message } = props;
	const classes = useStyles();
	const theme = useTheme();

	// Catch prop duplication
	// TODO this is redundant
	const {onClick, ...buttonProps} = props.buttonProps;

	const buttonOrder = reverse ? 1 : 3;

	const renderMessage = () => <Message/> || <BodyStandard order={2}
		styles={{
			paddingLeft: '0',
			paddingRight: '0',
			small: {
				paddingLeft: '10%',
				paddingRight: '10%',
			}
		}}
	>
		{props.message}
	</BodyStandard>;

		return (
			<div
				className={classes.buttonGroup}
			>
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
			</div>
		);
}

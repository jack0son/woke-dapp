import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Box from '@material-ui/core/Box';

import BodyStandard from '../components/text/body-standard'
import Button from '../components/buttons/button-contained'


const useStyles = makeStyles(theme => ({
	buttonGroup: styles => ({
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'center',
		bottom: 0,
		width: 'auto',
		height: 'auto',
		...styles
	})
}));

export default function ButtonGroupBelow (props) {
	const classes = useStyles(props.styles);
	const theme = useTheme();

	// Catch prop duplication
	// TODO this is redundant
	const {onClick, ...buttonProps} = props.buttonProps;

	const PassedButton = props.Button ? props.Button : null

	return (
		<Box
			className={classes.buttonGroup}
		>
			{ PassedButton ? (
				<PassedButton 
					{...props.buttonProps}
				/>
			) : (
				<Button 
					{...props.buttonProps}
				/>
			)}

			<BodyStandard
				color='secondary'
				styles={{
					paddingLeft: theme.spacing(3),
					paddingRight: theme.spacing(3),
					textAlign: 'center',
				}}
			>
				{props.message}
			</BodyStandard>
		</Box>
	);
}

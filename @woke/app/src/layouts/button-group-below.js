import React from 'react';
import { makeStyles, useTheme } from '@material-ui/styles';
import Box from '@material-ui/core/Box';

import BodyStandard from '../components/text/body-standard'
import Button from '../components/buttons/button-contained'


const useStyles = makeStyles(theme => ({
	buttonGroup: styles => ({
		position: 'relative',
		display: 'flex',
		flexWrap: 'wrap',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		height: 'auto',
		width: 'inherit',
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
			{...props.flexContainerProps}
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
					textAlign: 'center',
				}}
			>
				{props.message}
			</BodyStandard>
		</Box>
	);
}

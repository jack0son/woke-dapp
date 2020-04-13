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
	}),

	buttonWrapper: {
		alignItems: 'center',
		flexGrow: 1,
		display: 'flex',
		flexWrap: 'nowrap',
		marginLeft: '10%',
		marginRight: '10%',
	},

	centerTextOverflow: {
		textAlign: 'center',
		whiteSpace: 'nowrap',
		[theme.breakpoints.up('md')]: {
			marginLeft: '-100%',
			marginRight: '-100%',
		}
	},
}));

export default function ButtonGroupBelow (props) {
	const classes = useStyles(props.styles);
	const theme = useTheme();

	// Catch prop duplication
	// TODO this is redundant
	const buttonStyles = { width: '80%' };
	const {onClick, ...buttonProps} = { ...props.buttonProps, styles: buttonStyles };

	const PassedButton = props.Button ? props.Button : null


	return (
		<Box
			{...props.flexContainerProps}
			className={classes.buttonGroup}
		>
			{ PassedButton ? (
				<div className={classes.buttonWrapper}>
					<PassedButton 
						{...props.buttonProps}
					/>
				</div>
			) : (
				<Button 
					{...props.buttonProps}
				/>
			)}

			<BodyStandard
				//color={theme.palette.accents.secondary.main || 'secondary'}
				styles={{
					marginTop: '10%',
					color: theme.palette.accents.secondary.main || 'secondary',
					textAlign: 'center',
					paddingTop: '10px',
				}}
			>
				<span className={classes.centerTextOverflow}>{props.message}</span>
			</BodyStandard>
		</Box>
	);
}

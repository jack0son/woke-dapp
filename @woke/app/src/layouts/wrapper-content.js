import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';


const useStyles = makeStyles(theme => ({
	contentWrapper: styles => ({
		width: '100%',
		position: 'static',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		paddingRight: theme.spacing(2),
		paddingLeft: theme.spacing(2),
		marginTop: theme.spacing(2),
		...styles
	})
}));

export default function ContentWrapper(props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<Box
			className={classes.contentWrapper}
			style={{
				height: props.height ? props.height : '40vh',
			}}
			{...innerProps}
		/>
	);
}

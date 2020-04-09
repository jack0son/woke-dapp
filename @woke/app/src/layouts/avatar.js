import React from 'react';
import { makeStyles } from '@material-ui/styles';

import { default as MuiAvatar } from '@material-ui/core/Avatar';

const useStyles = makeStyles(theme => ({
	avatar: styles => ({
		[theme.breakpoints.down('sm')]: {
			...(styles.small || {})
		},
		...styles
	})
}));

export default function Avatar (props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<MuiAvatar
			{...innerProps}
			className={classes.avatar}
		/>
	);
}

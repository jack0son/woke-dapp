import React from 'react';
import { makeStyles } from '@material-ui/styles';

import { default as MuiAvatar } from '@material-ui/core/Avatar';

const useStyles = makeStyles(theme => ({
	avatar: styles => ({
		//width: '100%',
		//position: 'static',
		//display: 'block',
		//paddingRight: theme.spacing(2),
		//paddingLeft: theme.spacing(2),
		//marginTop: theme.spacing(2),
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

import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import Avatar from '../components/images/avatar-wrapped'


const useStyles = makeStyles(theme => ({
	avatarHeader: styles => ({
		//width: '120%',
		minHeight: '76px',
		height: '20vh',
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		//overflow: 'hidden',
		marginTop: theme.spacing(2),
		...styles
	}),

	centreLine: {
		//display: 'block',
		width: '50vw',
		height: '50%',
		position: 'absolute',
		left: 0,
		top: 0,
		paddingLeft: theme.spacing(4),
		paddingTop: theme.spacing(2),
		mx: theme.spacing(1),
		borderBottom: `2px solid ${theme.palette.accents.secondary.main}`,
		fontSizing: '18px',
		fontWeight: '700',
		color: '#46dc9e'
	}
	
}));

const defaultImageSrc =  'images/avatar-getwoke.jpg';

export default function AvatarHeader (props) {
	const {styles, src, handle, ...innerProps} = props;
	const classes = useStyles(styles);

	if(!handle) {
		props.handle = 'missing handle'
	}

	if(!src) {
		props.src = defaultImageSrc;
	}

	return (
		<Box
			className={classes.avatarHeader}
			{...innerProps}
		>
			<Box className={classes.centreLine}>
				@{props.handle}
			</Box>
			<Avatar src={props.src}/>
		</Box>
	);
}

import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import Avatar from '../components/images/avatar-wrapped'


const avatarHeightVH = 18;
const useStyles = makeStyles(theme => ({
	avatarHeader: styles => ({
		//width: '120%',
		minHeight: '76px',
		height: `${avatarHeightVH}vh`,
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		//marginBottom:  `${avatarHeightVH}vh`
		//overflow: 'hidden',
		//marginTop: theme.spacing(2),
		...styles
	}),

	centreLine: {
		//display: 'block',
		overflow: 'hidden',
		width: '100vw',
		height: '50%',
		position: 'absolute',
		left: '-10vw',
		//top: 0,
		paddingLeft: `${avatarHeightVH*2}vh`, //`${avatarHeightVH}vh`,
		//marginLeft: '-19vw',
		//paddingRight: '10vw',
		borderBottom: `${0.5}vh solid ${theme.palette.accents.secondary.main}`,
	},

	centreLineLeft: {
		//display: 'block',
		overflow: 'hidden',
		width: '50%',
		height: '50%',
		position: 'absolute',
		left: '-50%',
		top: 0,
		//paddingLeft: `${avatarHeightVH}vh`,
		paddingTop: 0,
		mx: theme.spacing(1),
		borderBottom: `${0.5}vh solid ${theme.palette.accents.secondary.main}`,
	},

	handle: {
		height: '100%',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
		fontSize: '2vh',
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
			<div className={classes.centreLine}>
				<div className={classes.handle}>
				@{props.handle}
				</div>
			</div>
			<Avatar src={props.src}/>
		</Box>
	);
}

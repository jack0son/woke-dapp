import React from 'react';
import { makeStyles } from '@material-ui/styles';

import Box from '@material-ui/core/Box';
import Avatar from '../components/images/avatar-wrapped'


const avatarHeightVH = 18;
const useStyles = makeStyles(theme => ({
	avatarHeader: styles => ({
		//width: '120%',
		alignSelf: 'flex-start',
		minHeight: '76px',
		height: `${avatarHeightVH}vh`,
		marginTop: `-${avatarHeightVH/3}vh`,
		zIndex: 600,
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		//marginBottom:  `${avatarHeightVH}vh`
		//overflow: 'hidden',
		//marginTop: theme.spacing(2),
		...styles
	}),

	avatar: {
		zIndex: 500,
		position: 'absolute',
		width: '100%',
		top: '100%',
		left: 0,
		height: `${avatarHeightVH}vh`,
		marginTop: `-${avatarHeightVH/2}vh`,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',

		[theme.breakpoints.down('sm')]: {
			height: `${2*avatarHeightVH/3}vh`,
			marginTop: `-${2*avatarHeightVH/6}vh`,
		},
	},

	centerLine: styles => ({
		zIndex: 100,
		//display: 'block',
		width: '100vw',
		height: '50%',
		position: 'absolute',
		//left: '-45vw',
		//left: '0',
		//left: `${styles.gutterSizeP}vw` || '0',
		//top: 0,
		//paddingLeft: `${avatarHeightVH*2}vh`, //`${avatarHeightVH}vh`,
		//marginLeft: '-19vw',
		//paddingRight: '10vw',
		borderBottom: `${0.5}vh solid ${theme.palette.accents.secondary.main}`,
	}),

	handle: {
		zIndex: 250,
		position: 'relative',
		top: '100%',
		height: '50%',
		width: '50%',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		fontSize: '2vh',
		fontWeight: '700',
		color: '#46dc9e',
		border: '0.15vh solid',
		borderLeft: '0px',
		[theme.breakpoints.down('sm')]: {
			border: '1px solid',
			borderLeft: '0.1vh solid',
			borderRight: '0px',
			paddingLeft: '10%',
			paddingLeft: '10%',
			marginLeft: '50%',
			// Position under centerline
			//paddingTop: '20%',
			//marginBottom: '-50%', //,
		},
	}

}));

const defaultImageSrc =  'images/avatar-getwoke.jpg';

export default function AvatarHeader (props) {
	// @TODO get gutter size from root context
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
			<div className={classes.centerLine}>
				<div className={classes.avatar}>
					<Avatar src={props.src}/>
				</div>
				<div className={classes.handle}>
					@{props.handle}
				</div>
			</div>
		</Box>
	);
}

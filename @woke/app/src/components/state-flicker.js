import React from "react";
import { makeStyles } from '@material-ui/styles';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles(theme => ({
	flickerBox: styles => ({
		// Layout
		position: 'absolute',
		bottom: 0,
		left: 0,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',

		// Size
		width: '20vh',
		//height: '80vh',

		// Spacing
		//marginLeft: 'auto',
		//marginRight: 'auto',

		...styles
	})
}));

export default function StateFlicker(props) {
	const {styles, ...innerProps} = props;
	const classes = useStyles(styles);

	return (
		<div className={classes.flickerBox}>
			<button onClick={() => props.dispatch({type: 'PREV'})}>PREV</button>
			<button onClick={() => props.dispatch({type: 'NEXT'})}>NEXT</button>
			<h1>{props.stageString}</h1>
		</div>
	);
}

import React, { useState } from "react";
import { makeStyles } from '@material-ui/styles';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

const useStyles = makeStyles(theme => ({
	overlayRow: styles => ({
		// Layout
		position: 'absolute',
		bottom: 0,
		left: 0,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		flexWrap: 'wrap',

		// Size
		width: '30vw',
		maxWidth: '100vw',

		// Color
		opacity: '50%',

		...styles
	})
}));

function VisibilityToggle({ show, toggle }) {
	const useStyles = makeStyles(theme => ({
		visIcon: {
			opacity: '50%',
		},
	}));


	return show ? <VisibilityOffIcon onClick={toggle}/> : <VisibilityIcon onClick={toggle}/>;
}

export default function StageOverlay(props) {
	const {styles, domain, ...innerProps} = props;
	const classes = useStyles(styles);

	const [show, setShow] = useState(true);
	const toggle = () => setShow( show => show ? false : true );

	return (
		<div className={classes.overlayRow}>
			<VisibilityToggle show={show} toggle={toggle}/>
			{ show ? props.children : null }
		</div>

	);
}

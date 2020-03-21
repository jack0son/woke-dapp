import React, { useState, useEffect } from "react";
import { makeStyles } from '@material-ui/styles';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import Switch from '@material-ui/core/Switch';

import { useDesignContext } from '../../hooks/design/design-context'
import { makeObjectCache } from '../../lib/utils';

const cache = makeObjectCache('design_mode');
const useStyles = makeStyles(theme => ({
	overlayRow: styles => ({
		// Layout
		position: 'absolute',
		bottom: 0,
		left: 0,
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
		alignContent: 'space-between',
		flexWrap: 'wrap',

		// Size
		//width: '30vw',
		maxWidth: '80vw',

		// Color
		opacity: '50%',

		...styles
	})
}));

const VisibilityToggle = ({ show, toggle }) => 
	!show ? <VisibilityOffIcon
		style={{ alignSelf: 'flex-end' }}
		onClick={toggle}
		/> : <VisibilityIcon onClick={toggle}/>

export default function StageOverlay(props) {
	const {styles, domain, ...innerProps} = props;
	const classes = useStyles(styles);

	const { save, setSave } = useDesignContext();

	const [show, setShow] = useState(true);
	const toggle = () => setShow( show => show ? false : true );

	const cached = cache.retrieve();
	const [settings, setSettings] = useState(cached || {});

	const updateSave = event => setSave(event.target.checked);

	const renderControls = () => (
		<>
		{ props.children }
			<div><Switch checked={save} onChange={updateSave} style={{ color: 'secondary' }}/>save</div>
		</>
	);

	return (
		<>
		<div className={classes.overlayRow}>
			{ show ? renderControls() : null }
			<VisibilityToggle show={show} toggle={toggle}/>
		</div>
		</>

	);
}

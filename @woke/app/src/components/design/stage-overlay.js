import React, { useState, useEffect } from "react";
import { makeStyles } from '@material-ui/styles';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import Switch from '@material-ui/core/Switch';
import Box from '@material-ui/core/Box';

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
		alignItems: 'center',
		alignContent: 'flex-end',
		flexWrap: 'wrap',

		// Size
		//width: '30vw',
		maxWidth: '80vw',

		// Color
		opacity: '50%',

		...styles
	})
}));

const VisibilityToggle = ({ show, toggle, order }) => 
	//<div order={order}> {
	!show ? <VisibilityOffIcon
		order={order}
		style={{
			//alignSelf: 'flex-end'
		}}
		onClick={toggle}
		/> : <VisibilityIcon order={order} onClick={toggle}/>
		//} </div>)

export default function StageOverlay(props) {
	const {styles, domain, ...innerProps} = props;
	const classes = useStyles(styles);

	const { save, setSave, overlay, setOverlay } = useDesignContext();

	const toggle = () => setOverlay( overlay => overlay ? false : true );
	const show = overlay;

	const cached = cache.retrieve();
	const [settings, setSettings] = useState(cached || {});

	const updateSave = event => setSave(event.target.checked);

	const renderControls = () => (
		<>
		{ props.children }
			<div order={5} alignSelf='flex-end'>
				<Switch
					order={5}
					checked={save}
					onChange={updateSave}
					style={{
						color: 'secondary',
						alignSelf: 'flex-end',
					}}
				/>
				save
			</div>
		</>
	);

	return (
		<>
		<div className={classes.overlayRow}>
			{ show ? renderControls() : null }
			<VisibilityToggle order={1} show={show} toggle={toggle}/>
		</div>
		</>

	);
}

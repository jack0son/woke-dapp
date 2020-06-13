import React, { useState, useEffect } from "react";
import { makeStyles } from '@material-ui/styles';
import Box from '@material-ui/core/Box';
import { useDesignContext } from '../../hooks/design/design-context'

const useStyles = makeStyles(theme => ({
	flickerBox: styles => ({
		// Layout
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',

		// Size
		...styles
	}),

	buttons: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
	}
}));

export default function StateFlicker(props) {
	const {styles, domainName, ...innerProps} = props;
	const classes = useStyles(styles);

	const { domains } = useDesignContext();
	const domain = domains[domainName];
	const [stageString, setStageString] = useState(domain && domain.options[domain && domain.stageIndex])

	useEffect(() => {
		if(domain) {
			setStageString(domain.options[domain.stageIndex]);
		}
	}, [domain]);

	if(!domain) return null;


	return (
		<div className={classes.flickerBox}>
			<div className={classes.buttons}>
				<button onClick={() => domain.dispatch({type: 'PREV'})}>PREV</button>
				<button onClick={() => domain.dispatch({type: 'NEXT'})}>NEXT</button>
			</div>
			{ props.children }
		</div>
	);
}

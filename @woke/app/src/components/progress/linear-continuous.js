import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';
import { setSyncTimeout } from '../../lib/utils';

import BodyLarge from '../text/body-large';
import BodyStandard from '../text/body-standard';

const useStyles = makeStyles({
	wrapper: styles => ({
		width: '100%',
		maxHeight: '2vh',
		flexGrow: 1,
		...styles,
	}),

	bar: {
		height: '0.5vh',
		width: '100%',
	},
});

function randSign() {
	return Math.random() > 0.5 ? 1 : -1;
}

// TODO add weights to stageList
export default function ContinuousProgress({value, endValue, ...props}) {
	const defaults = { step: 20 };
	const { step, styles, organic } = { ...defaults, ...props};
	const [completed, setCompleted] = useState(0);
	const [buffer, setBuffer] = useState(0);
	const classes = useStyles(styles);

	//const increment = Math.ceil(endValue * (step / 100));
	useEffect(() => {
	}, [value]);

	useEffect(() => {
		async function progress() {
			let diff = (value == endValue) ? 100 : 100 * value / endValue;
			// @brokenwindow this does not take into acount the timing of the input
			// value

			setBuffer(buffer => {
				return Math.min(diff*2, 100);
			});

			if(Math.floor(diff)%step == 0) {
				if(organic) {
					const rand = 5 * Math.random();
					//diff -= rand;
					diff += rand;
					await setSyncTimeout(rand * 500);
				}
				setCompleted(prev => {
					return Math.min(diff, 100);
				});
			}
		}

		progress()

	}, [value]);

	return (
		<>
			<div className={classes.wrapper}>
				<LinearProgress className={classes.bar} variant="buffer" value={completed} valueBuffer={buffer} />
			</div>
		</>
	);
}

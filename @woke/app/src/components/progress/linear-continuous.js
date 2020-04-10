import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';

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

// TODO add weights to stageList
export default function ContinuousProgress({value, endValue, ...props}) {
	const defaults = { step: 1 };
	const { step, styles } = { ...defaults, ...props};
	const [completed, setCompleted] = useState(0);
	const classes = useStyles(styles);

	//const increment = Math.ceil(endValue * (step / 100));

	useEffect(() => {
		function progress() {
			setCompleted(prev => {
				if (prev === 100) {
					return 0;
				}
				const diff = (value == endValue) ? 100 : (value / endValue) * 100;
				return Math.min(diff, 100);
			});
		}

		progress()

	}, [value]);

	return (
		<>
			<div className={classes.wrapper}>
				<LinearProgress className={classes.bar} variant="determinate" value={completed} />
			</div>
		</>
	);
}

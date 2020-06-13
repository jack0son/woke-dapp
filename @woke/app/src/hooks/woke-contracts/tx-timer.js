import React from 'react'

const averageBlockTime = 15000;
export default function useTxTimer(time = averageBlockTime, opts) {
	const defaults = { steps: 8 };
	const { steps } = {...defaults, ...opts};
	const [timer, setTimer] = React.useState(null);
	const [timerVal, setTimerVal] = React.useState(0);

	// TODO allow providing a callback on timer completion. e.g. indicating a tx
	// is taking too long.

	const start = () => {
		console.log('Start tx timer');
		setTimerVal(0);
		const inc = time / steps;
		setTimer(() => setInterval(
			() => setTimerVal(t => {
				if(t >= time) {
					setTimer(timer => clearInterval(timer));
					return time;
				}
				return t + inc;
			}), inc));
	}

	const stop = () => setTimer(timer => clearInterval(timer));

	return {
		start,
		stop,
		value: timerVal,
		transferTime: time,
	}
}

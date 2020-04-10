import React, { useState, useEffect } from 'react'

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
		const inc = time / steps;
		setTimer(() => setInterval(
			() => setTimerVal(t => {
				if(t >= time) {
					stop();
					return time;
				}
				return t + inc;
			}), inc));
	}

	const stop = () => {
		setTimerVal(0);
		setTimer(timer => clearInterval(timer));
	}

	return {
		start,
		stop,
		value: timerVal,
		transferTime: time,
	}
}

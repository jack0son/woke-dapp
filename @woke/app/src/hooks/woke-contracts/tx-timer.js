import React, { useState, useEffect } from 'react'

export default function useTxTimer(time, opts) {
	const steps = opts.steps || 10;
	const [timer, setTimer] = React.useState(null);
	const [timerVal, setTimerVal] = React.useState(0);

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

	const stop = () => setTimer(timer => clearInterval(timer));

	return {
		start,
		stop,
		value: timerVal,
		transferTime: time,
	}
}

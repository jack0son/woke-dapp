import React from "react";

export default function StateFlicker(props) {

	return (
		<div className="StateFlicker">
			<button onClick={() => props.dispatch({type: 'PREV'})}>PREV</button>
			<button onClick={() => props.dispatch({type: 'NEXT'})}>NEXT</button>
			<h1>{props.stageString}</h1>
		</div>
	);
}

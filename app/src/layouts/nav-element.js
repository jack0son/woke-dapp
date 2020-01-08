import React from 'react';

export default function NavElement(props) {
	return (
		<div width="auto" display="inline-block" position="relative" float={props.float}>
			{props.children}
		</div>
	);
}

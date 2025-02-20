import React from 'react';
import Slider from './slider';


export default function AmountSlider({defaultAmount, max, ...props}) {
	const defaults = {
		//min: 5,
		//step: 10,
		//disabled: 'false',
	};

	const { styles, ...other } = { ...defaults, ...props };

	return(
		<Slider
			defaultValue={defaultAmount}
			max={max}
			labelText={'give...'}
			styles={{
				minWidth: '60%',
				...styles,
			}}
			{ ...other }
		/>
	);
}

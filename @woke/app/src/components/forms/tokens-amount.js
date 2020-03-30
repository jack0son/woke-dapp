import React from 'react';

import AmountSlider from '../fields/slider-amount';
import NumberField from '../fields/number-outlined';

export default function TokenAmountForm(props) {
	const { amount, handleSetAmount, balance } = props;

	const defaults = {
		value: 5,
	};

	const handleSliderChange = (event, value) => handleSetAmount(value);
	const handleFieldChange = event => handleSetAmount(event.target.value);

	return (<>
		<AmountSlider
			onChangeCommitted={handleSliderChange}
			//controlledValue={amount} // causes slider to not render on drag

			flexGrow={4}
			defaultAmount={defaults.value < balance ? defaults.value : Math.floor(balance/2)}
			min={1}
			max={balance}
		/>
		<NumberField
			controlledValue={amount}
			handleChange={handleFieldChange}

			flexGrow={1}
			unitSymbol={'W'}
			unitPosition={'right'}
		/>
	</>);
}

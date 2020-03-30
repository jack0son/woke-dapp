import React from 'react';

import AmountSlider from '../fields/slider-amount';
import AmountField from '../fields/number-outlined';

export default function TokenAmountForm(props) {
	const { balance } = props;

	const defaults = {
		value: 5,
	};

	return (<>
		<AmountSlider
			defaultValue={defaults.value < balance ? defaults.value : Math.floor(balance/2)}
			min={1}
			max={balance}
		/>
		<AmountField
			unitSymbol={'W'}
			unitPosition={'right'}
		/>
	</>);
}

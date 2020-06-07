import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import AmountSlider from '../fields/slider-amount';
import NumberField from '../fields/number-outlined';

import FlexRow from '../../layouts/flex-row';

const useStyles = makeStyles((theme) => ({
	amountForm: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',

		width: '100%',
	}
}));

export default function TokenAmountForm({ amount, handleSetAmount, balance, ...props}) {
	const { styles } = props;

	const classes = useStyles(styles);

	const defaults = {
		value: 5 || props.defaultAmount,
	};

	const handleSliderChange = (event, value) => handleSetAmount(value);
	const handleFieldChange = event => handleSetAmount(event.target.value);

	return (
		<div className={classes.amountForm}>{/* style={{width: '100%'}}> */}
			<NumberField
				labelText='Amount'
				order={2}
				controlledValue={amount}
				handleChange={handleFieldChange}
				unitSymbol={'W'}
				unitPosition={'right'}
			/>
			<AmountSlider
				onChangeCommitted={handleSliderChange}
				//controlledValue={amount} // causes slider to not render on drag
				defaultAmount={defaults.value < balance ? defaults.value : Math.floor(balance/2)}
				step={Math.ceil(balance/100)}
				min={1}
				order={1}
				max={balance}
				styles={{
					order: 1,
					marginLeft: '5%',
					flexGrow: 8,
				}}
			/>
		</div>
	);
}

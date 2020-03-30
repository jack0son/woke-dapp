import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

const useStyles = makeStyles({
  slider: {
    width: 300,
  },
});

function valuetext(value) {
  return `${value}°C`;
}

export default function DiscreteSlider({defaultValue, max, ...props}) {
	const defaults = {
		min: 5,
		step: 10,
		labelText: 'Slider',
		disabled: 'false',
	};

	const {
		step,
		labelText, 
		disabled,
	} = { ...defaults, ...props };
  const classes = useStyles();

  return (
    <div className={classes.slider}>
      <Typography id="discrete-slider" gutterBottom>
				{ labelText }
      </Typography>
      <Slider
        valueLabelDisplay="auto"
				disabled={disabled}
        defaultValue={defaultValue}
        getAriaValueText={valuetext}
        step={step}
        min={10}
        max={110}
        aria-labelledby="discrete-slider"
        //marks
      />
    </div>
  );
}

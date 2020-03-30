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
  return `${value} W`;
}

export default function DiscreteSlider({defaultValue, max, ...props}) {
	const defaults = {
		min: 5,
		step: 100,
		labelText: 'Slider',
		disabled: false,
	};
	const other = { ...defaults, ...props };
  const classes = useStyles();


  return (
    <div className={classes.slider}>
      <Typography id="discrete-slider" gutterBottom>
				{ other.labelText }
      </Typography>
      <Slider
				max={max}
        valueLabelDisplay="auto"
        defaultValue={defaultValue}
        getAriaValueText={valuetext}
        aria-labelledby="discrete-slider"
        //marks
				{...other}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';

import BodyLarge from '../text/body-large';
import BodyStandard from '../text/body-standard';

const useStyles = makeStyles({
	wrapper: styles => ({
		marginTop: '10%',
		width: '100%',
		minWidth: '100%',
		height: '22%',
	}),

  bar: {
		//height: '100%',
		//width: '100%',
		minHeight: '100%',
    //flexGrow: 1,
  },
});

// TODO add weights to stageList
export default function LinearstageList(props) {
	if(typeof props.stageList !== 'array') { // this is an object?
		//console.dir(props.stageList);
		//throw new Error('Linear stageList only accepts an array');
	}
	const {stageList, stage, labelList, styles, bufferValue, bufferEnd} = props;
	const classes = useStyles(styles);

	const stageMap = {}
	stageList.forEach((stage, i) => {
		stageMap[stage] = i;
	});

  const [completed, setCompleted] = useState(0);
  const [buffer, setBuffer] = useState(0 || bufferValue);
	useEffect(() => {
		function progress() {
			let diff = (bufferValue == bufferEnd) ? 100 : ((bufferValue / bufferEnd) * (100 - completed)) + completed;
			setBuffer(Math.min(diff, 100));
		}

		if(bufferEnd) 
			progress();

	}, [bufferValue, completed]);

  useEffect(() => {
    function progress() {
      setCompleted(oldCompleted => {
        if (oldCompleted === 100) {
          return 0;
        }
				const diff = (stage + 1 == stageList.length) ? 100 : ((stage + 1) / stageList.length) * 100;
				//console.log(diff);
        return Math.min(diff, 100);
      });
    }

		progress()

  }, [stage]);

	const label = labelList ? labelList[stageList[stage]] : stageList[stage];

  return (
		<>
			<div className={classes.wrapper}>
				<BodyStandard styles={{small: {fontSize: '1rem', textAlign: 'left'}}}>{label}</BodyStandard>
			<br/>
				<LinearProgress className={classes.bar} variant={bufferEnd ? 'buffer' : 'determinate'} value={completed} valueBuffer={buffer}/>
			</div>
		</>
  );
}

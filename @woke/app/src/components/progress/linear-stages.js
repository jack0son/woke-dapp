import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';

import BodyLarge from '../text/body-large'

const useStyles = makeStyles({
  root: {
		width: 300,
    flexGrow: 1,
  },
});

// TODO add weights to stageList
export default function LinearstageList(props) {
	if(typeof props.stageList !== 'array') { // this is an object?
		//console.dir(props.stageList);
		//throw new Error('Linear stageList only accepts an array');
	}
	const {stageList, stage, labelList} = props;

	const stageMap = {}
	stageList.forEach((stage, i) => {
		stageMap[stage] = i;
	});

  const classes = useStyles();
  const [completed, setCompleted] = React.useState(0);

  React.useEffect(() => {
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
	console.log(labelList);
	console.log(label);

  return (
		<>
			<BodyLarge>{label}</BodyLarge>
			<br/>
      <LinearProgress variant="determinate" value={completed} />
		</>
  );
}

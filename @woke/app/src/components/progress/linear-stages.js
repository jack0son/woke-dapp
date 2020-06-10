import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';

import BodyLarge from '../text/body-large';
import BodyStandard from '../text/body-standard';

const useStyles = makeStyles({
	wrapper: styles => ({
		marginTop: '10%',
		width: '100%',
		maxHeight: '20%',
	}),

  bar: {
		height: '20%',
		width: '100%',
    flexGrow: 1,
  },
});

// TODO add weights to stageList
export default function LinearstageList(props) {
	if(typeof props.stageList !== 'array') { // this is an object?
		//console.dir(props.stageList);
		//throw new Error('Linear stageList only accepts an array');
	}
	const {stageList, stage, labelList, styles} = props;
	const classes = useStyles(styles);

	const stageMap = {}
	stageList.forEach((stage, i) => {
		stageMap[stage] = i;
	});

  const [completed, setCompleted] = React.useState(0);

  React.useEffect(() => {
    function progress() {
      setCompleted(oldCompleted => {
        if (oldCompleted === 100) {
          return 0;
        }
				const diff = (stage + 1 == stageList.length) ? 100 : ((stage + 1) / stageList.length) * 100;
				console.log(diff);
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
      <LinearProgress className={classes.bar} variant="determinate" value={completed} />
				</div>
		</>
  );
}

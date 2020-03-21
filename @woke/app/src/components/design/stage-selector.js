import React from 'react'
import { makeStyles } from '@material-ui/styles';
import { useDesignContext } from '../../hooks/design/design-context'
import StageFlicker from './stage-flicker'

const useStyles = makeStyles(theme => ({
	selectorRow: {
		// Layout
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
		marginLeft: '2%',
	},
}));

export default function({ domainName }) {
	const { domains } = useDesignContext();
	const classes = useStyles();

	const domain = domains[domainName];
	if(!domain) return null;

	const onChange = event => domain.select(event.target.value);

	return (
		<div className={classes.selectorRow}>
			<StageFlicker domainName={domainName}/>
			<select id={`stageSelector-${domainName}`} onChange={onChange} value={domain.options[domain.stageIndex]}>
				{
					domain.options.map(i => <option value={i}>{i}</option>)

				}
			</select>
		</div>
	);
}

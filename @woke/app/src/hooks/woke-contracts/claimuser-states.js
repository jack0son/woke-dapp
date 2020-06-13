export const statesList = [
	'READY',
	'TWEETED',
	'CONFIRMED',
	'FOUND_TWEET', 
	'FUNDED',
	'LODGING',
	'LODGED',
	'STORED_TWEET',
	'FINALIZING',
	'CLAIMED',
	'ERROR'
]

export const statesMap = {};
statesList.forEach((state,i) => statesMap[state] = i);

export const statesLabels = {};

statesLabels.CONFIRMED = 'concressing tweets ...';
statesLabels.FOUND_TWEET = 'funding your wallet ...';
statesLabels.FUNDED = 'submitting proof ...';
statesLabels.LODGING = 'submitting proof ...';
statesLabels.LODGED = 'consulting oracles ...';
statesLabels.STORED_TWEET = 'consulting oracles ...';
statesLabels.FINALIZING = '... deliverance is near';
statesLabels.CLAIMED = 'awakened.';

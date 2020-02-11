export const statesList = [
	'READY',
	'TWEETED',
	'CONFIRMED',
	'FOUND_TWEET', 
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

statesLabels.CONFIRMED = 'Concressing tweets ...';
statesLabels.FOUND_TWEET = 'Concressing tweets ...';
statesLabels.LODGING = 'Submitting proof ... ';
statesLabels.LODGED = 'Submitting proof ...';
statesLabels.STORED_TWEET = 'Consulting oracles ...';
statesLabels.FINALIZING = '... deliverance is near';
statesLabels.CONFIRMED = 'You are awakened.';

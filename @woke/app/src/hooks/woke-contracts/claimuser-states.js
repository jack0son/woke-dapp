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

statesLabels.CONFIRMED = 'concressing tweets';
statesLabels.FOUND_TWEET = 'concressing tweets';
statesLabels.LODGING = 'submitting proof';
statesLabels.LODGED = 'submitting proof';
statesLabels.STORED_TWEET = 'oracle has spoken';
statesLabels.FINALIZING = 'deliverance is near';
statesLabels.CONFIRMED = 'you are awakened';

export const statesList = [
//	'INIT',
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

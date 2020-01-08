import dayjs from 'dayjs';

// @param date: Date in any format acceptable for dayjs
// @returns Human readable abridged time since given date
export function timeSince(date, startDate = Date.now()) {
	startDate = dayjs(startDate);
	date = dayjs(date);

	const periods = [
		["seconds", 60],
		["minutes", 60],
		["hours", 24],
		["days", 30],
		["months", 12],
		["years", 100],
	];

	let diff, i;
	for(i = 0; i < periods.length; i++) {
		diff = startDate.diff(date, periods[i][0], true);
		if(diff <= periods[i][1]) {
			break;
		}
	}

	return `${Math.floor(diff)} ${periods[i][0]}`;
}

export function createShareIntentUrl(claimString) {
	return encodeURI(`https://twitter.com/intent/tweet?amp;ref_src=twsrc%5Etfw&amp;related=getwoketoke&amp;text=${claimString}&amp;tw_p=tweetbutton`)
}

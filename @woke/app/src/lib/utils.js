import dayjs from 'dayjs';

// @param date: Date in any format acceptable for dayjs
// @returns Human readable abridged time since given date
export function timeSince(date, startDate = Date.now()) {
	startDate = dayjs(startDate);
	date = dayjs(date);

	const periods = [
		["seconds", 60, "sec"],
		["minutes", 60, "min"],
		["hours", 24, "hour"],
		["days", 30, "day"],
		["months", 12, "month"],
		["years", 100, "year"],
	];

	let diff, i;
	for(i = 0; i < periods.length; i++) {
		diff = startDate.diff(date, periods[i][0], true);
		if(diff <= periods[i][1]) {
			break;
		}
	}

	const t = Math.floor(diff);
	return `${t} ${periods[i][2]}${t > 1 ? 's' : ''}`;
}

export function createShareIntentUrl(claimString) {
	return encodeURI(`https://twitter.com/intent/tweet?amp;ref_src=twsrc%5Etfw&amp;related=getwoketoke&amp;text=${claimString}&amp;tw_p=tweetbutton`)
}

export function clearOldVersionStorage(version) {
	const app_ver = window.localStorage.getItem('app_ver');
	if(app_ver != version) {
		window.localStorage.clear();
		window.localStorage.setItem('app_ver', version);
		return true;
	}
	return false;
}


export function setSyncTimeout(ms) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, ms);
	})
}

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

export function createShareIntentUrl(claimString, noEncode) {
	//return encodeURI(`https://twitter.com/intent/tweet?amp;ref_src=twsrc%5Etfw&amp;related=getwoketoke&amp;text=${claimString}&amp;tw_p=tweetbutton`)
	const str = `https://twitter.com/intent/tweet?&related=getwoketoke&text=${claimString}&amp;tw_p=tweetbutton`;
	return noEncode && str || encodeURI(str);
}

export function clearOldVersionStorage(version) {
	const app_ver = window.localStorage.getItem('app_ver');
	if(!app_ver) {
		console.log('Saving app_ver...');
		window.localStorage.setItem('app_ver', version);
		return false;
	}

	if(app_ver != version) {
		console.log('Found old app data. Clearing...');
		window.localStorage.clear();
		window.localStorage.setItem('app_ver', version);
		return true;
	}

	return false;
}


export function setSyncTimeout(ms) {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, ms);
	})
}

export function makeObjectCache(cacheKey) {
	function store (cache) {
		window.localStorage.setItem(cacheKey, JSON.stringify(cache));
	}

	function retrieve () {
		return JSON.parse(window.localStorage.getItem(cacheKey));
	}

	return {
		store,
		retrieve,
	}
}

// @dev this only works for a single key => callback handlers
// Will overwrite all other onkeydown event handlers
export function registerEnterKey(_callback) {
	let callback = _callback;
	document.onkeydown = e => {
		e = e || window.event;
		switch (e.which || e.keyCode) {
			case 13:
				callback();
				break;
		}
	};

	// Clear callback
	return () => { callback = () => {} };
};


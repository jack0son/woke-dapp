import React, {useState, useEffect, useMemo} from 'react';
import useTwitterContext from '../lib/twitter'

//@notice Initialise a twitter app-client instance
export const useAppClient = () => {
	const [client, setClient] = useState(null);

	useEffect(() => {
		twitter.initClient()
			.then(setClient(twitter))
			.catch(error => 
				console.log(`ERROR: failed to init twitter app client\n${error}`));
	}, [])

	return client;
// Test modules
// if NODE_ENV == dev
//import twitter from '../lib/twittermock' // import and init in App.js
}


export const useUserApi = props => {
}


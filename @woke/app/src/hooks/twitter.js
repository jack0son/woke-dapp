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

// @notice Get a list of a users followers
// @dev Pass client as argument to allow caller to manage client instance state
export const useFriends = ({twitterClient, userId, max}) => {
	const [friends, setFriends] = useState([]);

	max = max || 200;

	async function fetchFriends() {
		const friendCollection = await twitterClient.getUserFriendsList(userId, max);
		setFriends(friendCollection);
	}

	useEffect(() => {
		if(twitterClient) {
			fetchFriends();
		}
	}, [twitterClient]);

	return friends;
}

// @notice When userId's list changes, retrieve new user data from twitter as
// @dev Pass client as argument to allow caller to manage client instance state
export const useTwitterUsers = ({twitterClient, initialId}) => {
	// Change userIds to be object to avoid looping throught to check for new ids
	let cache = {};
	const [userIds, setUserIds] = useState([initialId]);
	const [userData, setUserData] = useState(cache); //
	const [fetching, setFetching] = useState(false);


  useEffect(() => {
		const fetchUserData = async (newData, id) => {
			let data = await twitterClient.getUserData(id);
			newData[id] = data;
			return;
		}

		const performFetches = async (newUserData, fetches) => {
			//setFetching(true);
			await Promise.all(fetches);
			setUserData(userData => ({...userData, ...newUserData}));
			//setFetching(false);
		}

		let fetches = [];
		let newUserData = {};
		if(twitterClient) {
			userIds.map(id => {
				// If we haven't got the user's data (handle, avatar etc.)
				if(!userData[id]) {
					fetches.push(fetchUserData(newUserData, id));
				}
				performFetches(newUserData, fetches);
			});
		}

  }, [twitterClient, userIds.length]);

	const userDataLength = useMemo(() => {
		return Object.keys(userData).length;
	}, [userData.data])


	return {
		state: {
			ids: userIds,
			data: userData,
			dataLength: userDataLength,
			fetching
		},
		setIds: setUserIds
	}
}

export const useUserApi = props => {
}


import React, {
	useState,
	useEffect,
	useMemo
} from 'react';
// @notice When userId's list changes, retrieve new user data from twitter as
export const useUsers = ({appClient, initialId}) => {
	// Change userIds to be object to avoid looping throught to check for new ids
	let cache = {}; // @TODO implement cache storage / retrieval
	const [userIds, setUserIds] = useState([initialId]);
	const [userData, setUserData] = useState(cache); //
	const [fetching, setFetching] = useState(false);

  useEffect(() => {
		const fetchUserData = async (newData, id) => {
			let data = await appClient.getUserData(id);
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
		if(appClient.hasUserAuth()) {
			userIds.map(id => {
				// If we haven't got the user's data (handle, avatar etc.)
				if(!userData[id]) {
					fetches.push(fetchUserData(newUserData, id));
				}
				performFetches(newUserData, fetches);
			});
		}

  }, [appClient, userIds.length]);

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

import React, {
	useState,
	useEffect,
	useMemo
} from 'react';
// @notice When userId's list changes, retrieve new user data from twitter as
export const useUsers = ({appClient, initialId}) => {
	// Change userIds to be object to avoid looping throught to check for new ids
	let cache = {}; // @TODO implement cache storage / retrieval
	const [userIds, setUserIds] = useState(initialId ? [initialId] : []);
	const [userData, setUserData] = useState(cache); //
	const [fetching, setFetching] = useState(false);

  useEffect(() => {
		let newUserData = {};
		const fetchUserData = async (id) => {
			let data = await appClient.getUserData(id);
			newUserData[id] = data;
			return;
		}

		const performFetches = async (fetches) => {
			//setFetching(true);
			await Promise.all(fetches);
			setUserData(userData => ({...userData, ...newUserData}));
			//setFetching(false);
		}

		//  @TODO check length from a ref to avoid uncessary map loop execution
		if(appClient.hasAppAuth()) {
			let fetches = [];
			userIds.forEach(id => {
				// If we haven't got the user's data (handle, avatar etc.)
				if(!userData[id]) {
					fetches.push(fetchUserData(id));
				}
			});
			performFetches(fetches);
		}

  }, [appClient, userIds.length]);

	const userDataLength = useMemo(() => {
		return Object.keys(userData).length;
	}, [userData.data])


	const addId = (userId) => {
		setUserIds(ids => {
			if(ids.includes(userId)) {
				return null;
			}
			return [...ids, userId];
		});
	}

	const appendIds = (_ids) => {
		setUserIds(ids => {
			const newIds = _ids.filter(id => !ids.includes(id));
			if(newIds.length == 0) {
				return null;
			}
			return [...ids, ...newIds];
		})
	}

	return {
		state: {
			ids: userIds,
			data: userData,
			dataLength: userDataLength,
			fetching
		},
		addId,
		appendIds
	}
}

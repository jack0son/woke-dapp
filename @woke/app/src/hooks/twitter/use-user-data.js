import React, { useState, useEffect } from 'react';

// @notice Get a list of a users followers
// @dev Pass client as argument to allow caller to manage client instance state
export const createUseFriends = (userClient) => ({userId, max}) => {
	const [friends, setFriends] = useState([]);

	max = max || 200;

	async function fetchFriends() {
		const friendCollection = await userClient.getUserFriendsList(userId, max);
		setFriends(friendCollection);
	}

	useEffect(() => {
		if(userClient.hasUserAuth()) {
			fetchFriends();
		}
	}, [userClient]);

	return friends;
}

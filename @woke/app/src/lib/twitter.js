const Twitter = require('twitter');
const debug = console.log;

var client, appOnlyClient, userClient;



let authOpts = {};

const initClient = async () => {

	if(bearerToken == undefined) {
		//try {
			bearerToken = await getBearerToken(consumerKey, consumerSecret);
		//} catch(e) {
		//	console.log(e);
		//	console.log('Failed to retrieve bearer token')
		//}
		//debug(bearerToken);
	}

	authOpts = {
		consumer_key: consumerKey, 
		consumer_secret: consumerSecret,
		bearer_token: bearerToken, 
		//access_token_key: null,
		//access_token_secret: null,
	}


	client = appOnlyClient;

	return;
}


const initUserClient = async (access_token, access_token_secret) => {

	userClient = new Twitter({
		consumer_key: consumerKey, 
		consumer_secret: consumerSecret,
		access_token_key: access_token,
		access_token_secret: access_token_secret,
	});

	client = appClient;

	return;
}





export const appClient = {initClient, findClaimTweet};

export default {getUserFriendsList, findClaimTweet, initClient, getUserOAuthToken, getUserAccessToken, getUserData, deparam}


/*
Twitter lib checks if using app-only like this

// Check to see if we are going to use User Authentication or Application Authetication
	if (this.options.bearer_token) {
		authentication_options = {
			headers: {
				Authorization: 'Bearer ' + this.options.bearer_token
			}
		};
	}
	*/

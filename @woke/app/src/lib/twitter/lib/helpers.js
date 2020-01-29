export function isValidOAuthToken(token) {
	return isValidToken(token);
}

export function isValidBearerToken(token) {
	return isValidToken(token);
}

export function isValidConsumerKey(key) {
	return isValidToken(key);
}

export function isValidConsumerSecret(secret) {
	return isValidSecret(secret);
}

export function isValidAccessKey(key) {
	return isValidToken(key);
}

export function isValidAccessSecret(secret) {
	return isValidSecret(secret);
}

export function isValidSecret(secret) {
	return isValidToken(secret);
}

export function isValidToken(token) {
	// @fix placeholder logic
	return token !== undefined && token !== null && token.length;
}


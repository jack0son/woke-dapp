const twitter = require('@woke/twitter');

const chooseTwitterClient = (env) => {
	switch (env) {
		case 'fake':
			return twitter.fake.FakeClient(1, {});
		case 'dev':
		case 'development':
		case 'production':
		default:
			return twitter.client;
	}
};

const TwitterClient = (type) => ({
	client: chooseTwitterClient(type),
	name: type,
});

module.exports = { TwitterClient };

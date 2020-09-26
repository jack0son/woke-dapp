const { twitter } = require('@woke/lib');

const chooseTwitterClient = (env) => {
	switch (env) {
		case 'fake':
			console.log('Using fake twitter client');
			return twitter.fake.FakeClient(1, {});
		case 'development':
		case 'staging':
		default:
			return twitter.client;
	}
};

const TwitterEnvironment = (env) => ({
	client: chooseTwitterClient(env),
	name: env,
});

module.exports = { TwitterEnvironment };

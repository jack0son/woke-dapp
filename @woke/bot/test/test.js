//const mocha = require('mocha');
const assert = require('assert');

const TwitterStub = require('../src/lib/twitter-stub');
const TwitterMock = require('./mocks/twitter-client');

context('Library Modules', function() {
	describe('twitterStub', function() {
		let twitter;
		before(() => {
			twitter = new TwitterStub({}, TwitterMock.MockClient);
		})

		it('should find tip tweets', async function() {
			const expected = TwitterMock.data.tipTweets;

			const tips = await twitter.findTips();
			expected.forEach(exp =>
				assert(tips.includes(exp), `Expected to find tip tweet "${exp.id_str}"`)
			);
		})
	})
})

context('Actor modules', function() {
	describe('twitterMonitor', function() {
		it('should poll for new tips', function() {
		});
	})

	describe('tweeter', function() {
		it('should notify sender of success', function() {
		})

		it('should notify sender of failure', function() {
		})
	})
})

//const mocha = require('mocha');
const assert = require('assert');

// const sampleTipTweets = require('./example-tip-tweets.json');
// const TwitterStub = require('../src/lib/twitter-stub');
// const TwitterMock = require('./mocks/twitter-client');

context('Library Modules', function () {
	describe('twitterStub', function () {
		let twitterStub;
		before(() => {
			// twitterStub = new TwitterStub({}, TwitterMock.MockClient);
		});

		it('should filter potential tip tweets into tips', async function () {
			this.skip();
			sampleTipTweets.forEach((t) => {
				console.log(t.id_str, ', isTip: ', t.isTip);
				console.log(t.full_text);
			});
			const tips = twitterStub.filterTipTweets(sampleTipTweets);
			console.log(`${tips.length} tips found in ${sampleTipTweets.length}`);

			tips.forEach((t) => {
				console.log(t.id_str, ', isTip: ', t.isTip);
				console.log(t.full_text);
			});
		});

		it('should do something for these scenarios: tip uses and @mention to address, or tip uses a reply to address', function () {
			this.skip();
		});

		it('should find tip tweets', async function () {
			this.skip();
			const expected = TwitterMock.data.tipTweets;
		});
	});
});

context('Actor modules', function () {
	describe('twitterMonitor', function () {
		it('should poll for new tips', function () {
			this.skip();
		});
	});

	describe('tweeter', function () {
		it('should notify sender of success', function () {
			this.skip();
		});

		it('should notify sender of failure', function () {
			this.skip();
		});
	});
});

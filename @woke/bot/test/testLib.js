//const mocha = require('mocha');
const assert = require('assert');

const sampleTipTweets = require('./example-tip-tweets.json');
const TwitterStub = require('../src/lib/twitter-stub');
const TwitterMock = require('./mocks/twitter-client');

context('Library Modules', function() {
	describe('twitterStub', function() {
		let twitterStub;
		before(() => {
			twitterStub = new TwitterStub({}, TwitterMock.MockClient);
		})

		it('should filter potential tip tweets into tips', async function() {
			sampleTipTweets.forEach(t => {
				console.log(t.id_str, ', isTip: ', t.isTip);
				console.log(t.full_text);
			});
			const tips = twitterStub.filterTipTweets(sampleTipTweets);
			console.log(`${tips.length} tips found in ${sampleTipTweets.length}`);

			tips.forEach(t => {
				console.log(t.id_str, ', isTip: ', t.isTip);
				console.log(t.full_text);
			});
		})

		it('should do something for these scenarios: tip uses and @mention to address, or tip uses a reply to address', () => {
			// difference between 
			//		toId: tweet.in_reply_to_user_id_str,
			//		toId: tweet.entities.user_mentions[0].id_str,
			// in actors/tipper.js
			// Parsing shouldn't be split between twitterStub and the tipper actor
		});

		it('should find tip tweets', async function() {
			const expected = TwitterMock.data.tipTweets;

			/*
			const tips = await twitterStub.findTips();
			expected.forEach(exp =>
				assert(tips.includes(exp), `Expected to find tip tweet "${exp.id_str}"`)
			);
			*/
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

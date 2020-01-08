const {waitForEvent} = require('./utils')
const TwitterOracle = artifacts.require('../contracts/TwitterOracle.sol')
const debug = require('./debug/TwitterOracle_test.js');
const truffleAssert = require('truffle-assertions');


// Successful query example http://app.provable.xyz/home/check_query?id=5094881757d8a90a06ba7d39ab4cd7c083897ef5ea1a63536542299af7c8bf2e

contract('TwitterOracle', function ([ defaultAccount, ...accounts ]) {

	const owner = accounts[0];
	const token = accounts[1];

	const stranger = accounts[2];
	const QUERY_SENT_STRING = 'Provable query sent, stand-by for response';
	const QUERY_NOT_SENT_STRING = 'Provable query NOT sent, add ETH to cover the query fee';

	const gas_amount = 3e6;

	let to;
	before(async () => {
		to = await TwitterOracle.new({from: defaultAccount, value: web3.utils.toWei('1','ether')});
	});

	describe("#findTweet", () => {

		const user_id = '932596541822419000';
		const handle = 'getwoketoke';
		const tweet_text = '@getwoketoke 0xWOKE:932596541822419000,0xa3dbd216369791be19bdc7458e37ab5e0c5e77b373a34719322260b078ce2a531581e60f152affde5db529cffd964a02ebc86f7285cfef66da02fb6f934d205801,1'; 

		let opts = { from: defaultAccount, gas: gas_amount };

		it('Should log a new query upon a request for tweet', async () => {
			const res = await to.findTweet(user_id, handle, opts);

			const description = res.logs[1].args.description;
			debug.t('LogNewQuery.description: ', description);

			assert.strictEqual(
				description,
				QUERY_SENT_STRING,
			)
		})


		it('Should log a failed second request for custom headers due to lack of funds', async () => {
			//const res = await to.findTweet(user_id, handle, opts);

			const description = res.logs[0].args.description;
			debug.t('LogNewQuery.description: ', description);

			assert.strictEqual(
				description,
				QUERY_NOT_SENT_STRING
			)
		})
		
		// Check that storage of the Twitter text happens successfully
		it('should fail to return saved text if request incomplete', async () => {
			await truffleAssert.reverts(
				to.getTweetText(user_id),
				"No tweet text stored for this user."
			);
		})

		it('should emit result from tweet request', async () => {
			debug.t('Waiting for query result...');
			const { returnValues: { result } } = await waitForEvent(to.LogResult)
			debug.t("Result from custom header query:");
			debug.i(result);

			assert.isTrue(
				result.includes(tweet_text)
			)
		})

		// Check that storage of the Twitter text happens successfully
		it('should store twitter text', async () => {
			let savedText = await to.getTweetText(user_id);
			debug.t('savedText: ', savedText);
			assert.equal(example_status_text, savedText, 'Post not saved!')
		})
		

	});

	describe("#requestTweet", () => {
		const example_status_id = '1146384868630130689';
		const example_status_text = 'find a new tweet to test this'

		let opts = { from: defaultAccount, gas: gas_amount };

		it('Should log a new query upon a request for tweet', async () => {
			//await to.send(web3.utils.toWei('0.1', "ether"));
			const res = await to.requestTweet(example_status_id, opts);

			const description = res.logs[0].args.description;
			debug.t('LogNewQuery.description: ', description);

			assert.strictEqual(
				description,
				QUERY_SENT_STRING,
			)
		})

		it('Should log a failed second request for custom headers due to lack of funds', async () => {
			const res = await to.requestTweet(example_status_id, opts);

			const description = res.logs[0].args.description;
			debug.t('LogNewQuery.description: ', description);

			assert.strictEqual(
				description,
				QUERY_NOT_SENT_STRING
			)
		})

		it('should emit result from tweet request', async () => {
			const tweetContains = '@thehandleoftheuser';
			const {inspect} = require('util')

			debug.t('Waiting for query result...');
			const { returnValues: { result } } = await waitForEvent(to.LogResult)
			debug.ti("Result from custom header query:", result);

			assert.isTrue(
				result.includes(tweetContains)
			)
		})

		// Check that storage of the Twitter text happens successfully
		it('should store twitter text', async () => {
			let savedText = await to.getTweetText(example_status_id);
			debug.t('savedText: ', savedText);
			assert.equal(example_status_text, savedText, 'Post not saved!')
		})

	});
});

//context('Using dummy oracle', async () => {
//});

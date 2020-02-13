class TwitterStub {
	constructor(_credentials, _Client) {
		const self = this;
		self.client = new _Client(_credentials);
	}

	async findTips() {
		const { client } = this;

		const query = '';
		const tips = await client.searchTweets(query)

		return tips;
	}
}

module.exports = TwitterStub;

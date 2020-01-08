const debug = require('debug')('server:funder');
const Emitter = require('events');
const initWeb3 = require('./web3-init');

const {web3, network, account} = initWeb3();
const DEFAULT_WEI = web3.utils.toWei('0.2', 'ether');

// TODO confirm with woketoken that account is not already funded
class Funder extends Emitter {
	constructor(donationAmount = DEFAULT_WEI) {
		super();
		const self = this;
		self.account = account;
		self.value = donationAmount
		self.txFailures = [];

		self.initWeb3().then(success => success ?
			self.setupListener() :
			debug('Could not setup funding listener')
		);
	}

	async initWeb3() {
		const self = this;

		let web3Instance;

		const maxAttempts = 5;
		let attempts = 0;
		let connected = false;

		while(!connected) {
			attempts += 1;
			web3Instance = initWeb3();

			if(attempts == 1) {
				console.dir(web3Instance.network);
			}

			try {
				debug(`Attempting Web3 connection on network ${web3Instance.network.id} ...`);
				await web3Instance.web3.eth.net.getId();
				connected = true;
			} catch (error) {
				debug('Encountered error trying to instantiate new Web3 instance ...');
				debug('... ', error);
			}

			if(!connected) {
				if(attempts >= maxAttempts) {
					debug(`FATAL ERROR: Could not instantiate Web3 after ${attempts} attempts.`);
					return false;
				}
				await asyncTimeout(3000);
			}
		}

		const {web3, network, account} = web3Instance;
		self.web3 = web3;
		self.network = network;
		self.acccount = account;

		let chainId = await self.web3.eth.getChainId();
		let id = await self.web3.eth.net.getId();
		debug(`web3.eth.getChainId: ${chainId}`);
		debug(`web3.eth.net.getId: ${chainId}`);
		debug('default common', web3.eth.defaultCommon);

		self.chainId = chainId;

		debug('... Web3 connection success');
		return true;
	}

	setupListener() {
		const self = this;

		debug('Fund pool address: ', self.account);

		self.on('new-user', user => {
			debug(`Funding ${user.username} at ${user.walletAddress} ... `);
			self.fundWallet(user.walletAddress)
				.then(receipt => {
					debug(`FUNDED: Sent ${self.value} to ${user.username}`)
				})
				.catch(error => self.failedToFund(error));
		});
	}

	async fundWallet(address, amount) {
		const self = this;

		const txOpts = {
			from: self.account,
			value: self.value,
			to: address,
			gas: self.network.gasLimit,
			gasPrice: self.network.gasPrice,
			common: self.network.defaultCommon,
		};

		const maxAttempts = 3;
		let attempts = 0;
		let receipt;

		let reinstantiations = {
			count: 0,
			max: 1,
		};

		while(!receipt) {
			attempts += 1;

			try {
				await self.web3.eth.net.getId();
				let r = await self.web3.eth.sendTransaction(txOpts)
					.once('transactionHash', hash => debug)
				receipt = r;

			} catch (error) {
				debug(error);
				debug('... retrying funding');
			}

			if(!receipt) {
				if(attempts >= maxAttempts) {
					if(reinstantiations.count < reinstantiations.max) {
						reinstantiations.count += 1;
						attempts = 0;
						const connected = await self.initWeb3();
						if(!connected) {
							break;
						}

					} else {
						throw new Error(`Could not fund user after ${attempts} attempts.`);
					}
				} else {
					await asyncTimeout(3000);
				}
			}
		}
		return receipt;
	}

	failedToFund(user, failure) {
		debug(`Failed to fund ${user}:`);
		console.error(failure);
		this.txFailures.push({
			user: user,
			failure: failure
		});
		// TODO record in DB
	}

	stop() {
		// provider.engine.stop(); // this is bad form lol
	}
}

function asyncTimeout(ms) {
	return new Promise((resolve, reject) => setTimeout(() => {
		resolve();
	}, ms));
}

module.exports = Funder;

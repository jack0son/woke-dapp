const waitForEvent = (_event, _from = 0, _to = 'latest') =>
	new Promise((resolve, reject) =>
		_event({ fromBlock: _from, toBlock: _to }, (err, event) =>
			//_event((err, event) =>
			err ? reject(err) : resolve(event)
		)
	);

const waitForNextEvent = (_contract) => (_event, _from = 0, opts) =>
	//event: {fromBlock: _from, toBlock: _to}, (err, event) =>
	new Promise((resolve, reject) => {
		_contract.once(_event, { fromBlock: _from, ...opts }, (err, event) => {
			err ? reject(err) : resolve(event);
		});
	});

const makeLogEventSubscription = (web3) => (contract, eventName, handleFunc, opts) => {
	let subscription = null;

	const eventJsonInterface = web3.utils._.find(
		contract._jsonInterface,
		(o) => o.name === eventName && o.type === 'event'
	);

	// Handle subscription data
	const handleUpdate = (error, result) => {
		let event = result
			? web3.eth.abi.decodeLog(
					eventJsonInterface.inputs,
					result.data,
					result.topics.slice(1)
			  )
			: result;
		handleFunc(error, { ...result, event });
	};

	const start = () => {
		const newSub = web3.eth.subscribe(
			'logs',
			{
				...opts,
				address: contract.options.address,
				topics: [eventJsonInterface.signature],
			},
			handleUpdate
		);

		// console.log(
		// 	`... Subscribed to ${eventName} ${
		// 		opts && opts.fromBlock ? `bn: ${opts.fromBlock}` : ''
		// 	}`
		// );
		//console.log(newSub);
		//subscription.on("data", console.log);
		subscription = newSub;
	};

	// @fix Ubscribing does not appear to work on web3js@1.2.5
	const stop = () => subscription.unsubscribe();

	const resubscribe = () => {
		console.log(`... Resubscribed to ${eventName}.`);
		subscription.subscribe(handleUpdate);
	};

	return {
		start,
		resubscribe,
		stop,
	};
};

// Set the gas limit and price taking eth balance into account.
// If sufficient funds, use comfortable buffer for gas limit, and set a high
// price.
// @param method: web3Contract[method]
const safeGasEstimate = (web3) => async (txObject, txOpts) => {
	const debug = () => {};
	const toEth = (wei) => web3.utils.fromWei(wei, 'ether');
	const valStr = (wei, delim = ', ') => `${toEth(wei)} ETH${delim}${wei.toString()} wei`;
	const BN = web3.utils.BN;

	let gasPrice = new BN(txOpts.gasPrice);
	let gasLimit = new BN(txOpts.gas);

	try {
		// Fetch network gas price
		const medianPrice = await web3.eth.getGasPrice();
		debug(`Median price: ${valStr(medianPrice)}`);

		// Determine transaction cost
		let estimate = await txObject.estimateGas({
			from: txOpts.from,
		});
		//debug(`Gas estimate: ${estimate}`);
		let cost = gasPrice.mul(new BN(estimate));
		//debug(`Cost estimate: ${valStr(cost)}`);

		debug('Sender', txOpts.from);
		let balance = new BN(await web3.eth.getBalance(txOpts.from));
		debug(`Sender balance: ${valStr(balance)}`);

		const logOpts = ({ limit, price, cost }) => {
			debug(
				`\tGas:\t${limit.toString()}\n\tPrice:\t${valStr(price, '\t')}\n\tCost:\t${valStr(
					cost,
					'\t'
				)}`
			);
		};

		// Calculate tx options by applying multipliers to the gasLimit and price
		// @param gasFactor: number
		// @param priceFactor: number
		const calcTxOpts = (gasFactor, priceFactor) => {
			const selectOperator = (factor) =>
				factor >= 1.0 ? ['mul', factor] : ['div', 1 / factor];

			const applyFactor = (base, factor) => {
				if (!BN.isBN(base)) base = new BN(base);
				let [op, f] = selectOperator(factor);
				if (f % 1 !== 0) {
					f = new BN(f * 100);
					let tmp = base[op](f);
					return tmp[op == 'mul' ? 'div' : 'mul'](new BN(100));
				} else {
					return base[op](new BN(f));
				}
			};

			let limit = applyFactor(estimate, gasFactor);
			limit = txOpts.gas && limit.gt(new BN(txOpts.gas)) ? txOpts.gas : limit;

			let price = applyFactor(medianPrice, priceFactor);

			return { limit, price, cost: limit.mul(price) };
		};

		// Decide on gas price and limit
		let tolerance = 0.05;
		const min = calcTxOpts(1 + tolerance, 0.8);
		debug('Min opts:');
		logOpts(min);

		let speedMultiplier = 2;
		const max = calcTxOpts(speedMultiplier, speedMultiplier);
		debug('Max opts:');
		logOpts(max);

		let opts;
		if (max.cost.lt(balance)) {
			debug(`Using speed factored median price`);
			opts = max;
		} else if (min.cost.lte(balance)) {
			debug(`Using minimised cost`);
			opts = min;
		} else {
			debug('Error: cannot afford tx at median gas cost');
			throw new Error('cannot afford tx at median gas cost');
		}
		logOpts(opts);
		debug(``);
		// return opts;
		return { gas: opts.limit, gasPrice: opts.price, cost: opts.cost };
	} catch (error) {
		throw error;
		// What errors can we expect here?
	}
};

// Compatible with web3.utils.hexToBytes
const uInt32ToHexString = (uInt32) => {
	const buff = new ArrayBuffer(4);
	const data = new DataView(buff);
	data.setUint32(0, uInt32, false);
	const uInt8Buffer = Buffer.from(buff);
	const solStr = uInt8Buffer.toString('hex');
	return solStr;
	//return `0x${solStr}`;
};

const _uInt32ToHexString = (uInt32) =>
	Buffer.from(new DataView(new ArrayBuffer(4)).setUint32(0, uInt32, false)).toString(
		'hex'
	);

const valueString = (web3Utils) => {
	//const BN = web3Utils.BN;
	const toEth = (wei) => web3Utils.fromWei(wei, 'ether');
	return (wei, delim = ', ') => `${toEth(wei)} ETH${delim}${wei.toString()} wei`;
};

// @param a: address string
const abridgeAddress = (a, l = 8) =>
	`${a.slice(0, 2 + l)}...${a.slice(a.length - l, a.length)}`;

const getEvents = (contractInstance) => async (eventName, filter) => {
	let opts = {
		fromBlock: 0,
	};
	const events = await contractInstance.getPastEvents(eventName, opts);
	return filter
		? events.filter((e) => {
				let match = true;
				for (prop of Object.keys(filter)) {
					if (e.returnValues[prop] !== filter[prop]) {
						match = false;
						break;
					}
				}
				return match;
		  })
		: events;
};

module.exports = {
	waitForEvent,
	waitForNextEvent,
	makeLogEventSubscription,
	safeGasEstimate,
	uInt32ToHexString,
	valueString,
	abridgeAddress,
	getEvents,
};

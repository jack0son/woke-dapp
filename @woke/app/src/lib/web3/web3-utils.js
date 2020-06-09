// @param artifact: Truffle contract json artifact
export const getContract = (web3, artifact, networkId) => {
	if(!artifact.networks[networkId]) {
		console.dir(artifact)
		console.dir(networkId)
	}
	if(!artifact.networks[networkId].address) {
		console.dir(artifact);
		console.dir(networkId);
		//throw new Error(`Contract not deployed on network ID ${networkId}`);
	}
	const contract = new web3.eth.Contract(
		artifact.abi,
		artifact.networks[networkId].address,
		//{data: artifact.bytecode}
	)
	contract.options.address = artifact.networks[networkId].address;

	return contract;
}

export async function genClaimString(web3, signatory, userId, app = 'twitter') {
  const appId = {
    'default' : 0,
    'twitter' : 10,
    'youtube' : 20,
    'reddit' : 30
  }

  let msgHash = web3.utils.soliditySha3(
    {t: 'uint256', v: signatory},
    {t: 'string', v: userId},
    {t: 'uint8', v: appId[app]}
  ).toString('hex');

  const sig = await web3.eth.sign(msgHash, signatory);

  let str = `@getwoketoke 0xWOKE:${userId},${sig},1`;
  return str;
}

// Set the gas limit and price taking eth balance into account.
// If sufficient funds, use comfortable buffer for gas limit, and set a high
// price.
// @param method: web3Contract[method]
export const safePriceEstimate = web3 => async (contract, method, args, txOpts, opts) => {
	const options = {
		speedMultiplier: 2,
		tolerance: 0.05, // gas limit tolerance
		...opts,
	};

	const toEth = wei => web3.utils.fromWei(wei, 'ether');
	const valStr = (wei, delim = ', ') => `${toEth(wei)} ETH${delim}${wei.toString()} wei`;
	const BN = web3.utils.BN;

	let gasPrice = new BN(txOpts.gasPrice);
	let gasLimit = new BN(txOpts.gas);

	try { 
		// Fetch network gas price
		const medianPrice = await web3.eth.getGasPrice();
		console.log(`Median price: ${valStr(medianPrice)}`);

		// Determine transaction cost
		let estimate = await contract.methods[method](...args).estimateGas({ from: txOpts.from });
		//console.log(`Gas estimate: ${estimate}`);
		let cost = gasPrice.mul(new BN(estimate));
		//console.log(`Cost estimate: ${valStr(cost)}`);

		console.log('Sender', txOpts.from);
		let balance = new BN(await web3.eth.getBalance(txOpts.from));
		console.log(`Sender balance: ${valStr(balance)}`);

		const logOpts = ({limit, price, cost}) => {
			console.log(`\tGas:\t${limit.toString()}\n\tPrice:\t${valStr(price, '\t')}\n\tCost:\t${valStr(cost, '\t')}`);
		}

		// Calculate tx options by applying multipliers to the gasLimit and price
		// @param gasFactor: number
		// @param priceFactor: number
		const calcTxOpts = (gasFactor, priceFactor) => {
			const selectOperator = factor => factor >= 1.0 ? ['mul', factor] : ['div', 1/factor];

			const applyFactor = (base, factor) => {
				if(!BN.isBN(base)) base = new BN(base);
				let [op, f] = selectOperator(factor);
				if(f % 1 !== 0) {
					f = new BN(f * 100);
					let tmp = base[op](f);
					return tmp[op == 'mul' ? 'div' : 'mul'](new BN(100));
				} else {
					return base[op](new BN(f));
				}
			}

			let limit = applyFactor(estimate, gasFactor)
			limit = txOpts.gas && limit.gt(new BN(txOpts.gas)) ? txOpts.gas : limit;

			let price = applyFactor(medianPrice, priceFactor);

			return { limit, price, cost: limit.mul(price) };
		}

		// Decide on gas price and limit
		const min = calcTxOpts(1 + options.tolerance, 0.8);
		console.log('Min opts:'); logOpts(min);
		const max = calcTxOpts(options.speedMultiplier, options.speedMultiplier);
		console.log('Max opts:'); logOpts(max);

		let opts;
		if(max.cost.lt(balance)) {
			console.log(`Using speed factored median price`);
			opts = max;
		} else if(min.cost.lte(balance)) {
			console.log(`Using minimised cost`);
			opts = min;
		} else {
			console.log('Error: cannot afford tx at median gas cost');
			throw new Error('cannot afford tx at median gas cost');
		}
		logOpts(opts);
		console.log(``);
		return opts;

	} catch(error) {
		throw error
		// What errors can we expect here? 
	}
}

// @dev subscribe to any and all contract logs
// @param handleFunc: called with raw log data when contract updates
export const subscribeLogContract = web3 => (contract, handleFunc) => {
	let subscription = null;
	const start = () => {
		const newSub = web3.eth.subscribe('logs', {
			address: contract.options.address,
		}, (error, result) => {
			if (!error) {
				handleFunc(result);
			} else {
				console.error(error);
			}
		})
		subscription = newSub;
		//console.log('Subscriber', `Subscribed to ${contract.options.address}`);
	}

	const stop = () => new Promise((resolve, reject) => 
		subscription.unsubscribe((error, succ) => {
			if(error) {
				reject(error);;
			}
			console.log(`... unsub'd ${contract.options.address}`);
			resolve(succ);
		})
	);

	return {
		start,
		stop,
	}
}

// @dev Call callback when new block header received
// @dev https://web3js.readthedocs.io/en/v1.2.8/web3-eth-subscribe.html#subscribe-newblockheaders
// @param handleFunc: called with raw log data when contract updates
export const subscribeBlockHeaders = web3 => handleFunc => {
	let subscription = null;
	let id;
	const start = () => {
		const newSub = web3.eth.subscribe('newBlockHeaders', (error, result) => {
			if (!error) {
				handleFunc(result); // result: block header
			} else {
				console.error(error);
			}
		})
			.on("connected", function(subscriptionId){
				id = subscriptionId;
				console.log(`web3-sub:block: connected ${id}`);
			})
			.on("data", function(blockHeader){
				//console.log(blockHeader);
			})
			.on("error", console.error);
		subscription = newSub;
	}

	const stop = () => new Promise((resolve, reject) => 
		subscription.unsubscribe((error, succ) => {
			if(error) {
				reject(error);;
			}
			console.log(`web3-sub:block: ... unsub'd ${id}`);
			resolve(succ);
		})
	);

	return {
		start,
		stop,
	}
}

export const makeLogEventSubscription = web3 => (contract, eventName, opts, handleFunc) => {
	let subscription = null;
	const start = () => {
		const eventJsonInterface = web3.utils._.find(
			contract._jsonInterface,
			o => o.name === eventName && o.type === 'event',
		);
		const newSub = web3.eth.subscribe('logs', {
			...opts,
			address: contract.options.address,
			topics: [eventJsonInterface.signature],
		}, (error, result) => {
			if (!error) {
				const eventObj = web3.eth.abi.decodeLog(
					eventJsonInterface.inputs,
					result.data,
					result.topics.slice(1)
				)
				//debug.ei(`${eventName}:`, eventObj)
				handleFunc(eventObj);
			} else {
				console.error(error);
			}
		})

		subscription = newSub;
		subscription.on("data", log => console.log);
		//console.log('Subscriber', `Subscribed to ${eventName}.`);
	}

	const stop = () => new Promise((resolve, reject) => 
		subscription.unsubscribe((error, succ) => {
			if(error) {
				reject(error);;
			}
			console.log(`... unsub'd ${eventName}`);
			resolve(succ);
		})
	);

	return {
		start,
		stop,
	}
}

const { web3Tools } = require('@woke/lib');

//const web3Utils = require('web3-utils');
//const DEFAULT_WEI = web3Utils.toWei('0.04', 'ether');

const artifacts = require('@woke/contracts');
const wokeTokenInterface = artifacts[process.env.NODE_ENV !== 'development' ? 'production' : 'development'].WokeToken;

const { web3, account, network } = web3Tools.init();
const BN = web3.utils.BN;
console.log(web3.version);

const toEth = wei => web3.utils.fromWei(wei, 'ether');

console.log(network);

function initContract() {
	return new web3.eth.Contract(wokeTokenInterface.abi, wokeTokenInterface.networks[network.id].address);
}

let txOpts = {
	//gas: network.gasLimit,
	gas: network.gasLimit,
	gasPrice: network.gasPrice,
	common: network.defaultCommon,
	from: account,
};

const accountBalances = () => web3.eth.getAccounts().then(
	accounts => Promise.all(accounts.map((acc, i) => 
		web3.eth.getBalance(acc).then(balance => console.log(`${i}: ${acc} - ${toEth(balance)} ETH`)
	))
));

const sendSomeTx = async () => {
	web3.eth.handleRevert = true;
	const woken = initContract();

	// Check gas things
	const [migrator, owner, oracle, ...accounts] = await web3.eth.getAccounts();
	const [a, b, c, poor] = accounts;

	txOpts.from = a;
	let gasPrice = new BN(txOpts.gasPrice);
	let gasLimit = new BN(txOpts.gas);
	console.log('gasPrice: ', gasPrice.toString());
	console.log('gasLimit: ', gasLimit.toString());

	maxTxCost = gasPrice.mul(gasLimit);
	console.log(`Max tx cost ${valStr(maxTxCost.toString())}`);
	console.log('\n');

	let send = poor;
	const balance = web3.utils.fromWei((await web3.eth.getBalance(send)), 'ether')
	console.log(`Poor's balance: ${balance}`);
	let opts = {...txOpts, from: send, to: owner, value: 1};
	let estimate = await web3.eth.estimateGas(opts);
	let r = await web3.eth.sendTransaction(opts)
	console.log('Gas used: ', r.gasUsed);

	const userId = `randomUser-${Math.floor(Math.random() * Math.floor(1000))}`;
	await safeGas(woken, 'claimUser', [userId], txOpts);

	//await accountBalances();
	//r = await woken.methods.claimUser(userId).send(txOpts);
	//console.log(r);
}

const valStr = (wei, delim = ', ') => `${toEth(wei)} ETH${delim}${wei.toString()} wei`;

// Set the gas limit and price taking eth balance into account.
// If sufficient funds, use comfortable buffer for gas limit, and set a high
// price.
// @param method: web3Contract[method]
async function safeGas(contract, method, args, txOpts) {
	let gasPrice = new BN(txOpts.gasPrice);
	let gasLimit = new BN(txOpts.gas);

	//console.dir(contract.options.jsonInterface, {depth: 2});
	console.log(`\nDetermine safe gas to send method-${method} to ${contract._address}`);

	try { 
		// Fetch network gas price
		const medianPrice = await web3.eth.getGasPrice();
		console.log(`Median price: ${valStr(medianPrice)}`);

		// Determine transaction cost
		let estimate = await contract.methods[method](...args).estimateGas({ from: txOpts.from });
		console.log(`Gas estimate: ${estimate}`);
		let cost = gasPrice.mul(new BN(estimate));
		console.log(`Cost estimate: ${valStr(cost)}`);

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
					console.log(f);
					f = new BN(f * 100);
					//f = new BN(f )//* 100);
					console.log(f.toString());
					let tmp = base[op](f);
					//return tmp;
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
		let tolerance = 0.05;
		const min = calcTxOpts(1 + tolerance, 0.8);
		logOpts(min);

		let speedMultiplier = 2;
		const max = calcTxOpts(speedMultiplier, speedMultiplier);
		logOpts(max);

		let opts;
		if(max.cost.lt(balance)) {
			console.log(`Using speed factored median price`);
			opts = max;
		} else if(min.cost.lte(balance)) {
			console.log(`Using minimised cost`);
			opts = min;
		} else {
			console.log('Error: cannot afford tx at median gas cost');
			return;
		}
		logOpts(opts);
		console.log(``);
		return opts;

	} catch(error) {
		throw error
		// What errors can we expect here? 
	}
}



sendSomeTx().catch(console.log);

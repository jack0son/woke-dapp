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

const sendSomeTx = async () => {
	web3.eth.handleRevert = true;
	const woken = initContract();

	// Check gas things
	const [migrator, owner, oracle, ...accounts] = await web3.eth.getAccounts();
	const [a, b, c, poor] = accounts;

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
	//r = await woken.methods.claimUser(userId).send(txOpts);
	//console.log(r);
}

const valStr = wei => `${toEth(wei)} ETH, ${wei.toString()} wei`;

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

		let balance = await web3.eth.getBalance(txOpts.from);
		console.log(`Sender balance: ${valStr(balance)}`);

		// Decide on gas price and limit
		let price;
		const factor = new BN(2);
		if(false && cost > balance) {
			// Insufficient balance
			console.log('Error: cannot affort tx at median gas cost');
			return;
		} else if( false ) {
			// Use lowest cost option
		} else {
			// Use fast options
			let limit = (new BN(estimate)).mul(factor);
			price = (new BN(medianPrice)).mul(factor);
			console.log(price);
			let maxCost = limit.mul(price);
			console.log(`Using factored median cost ${valStr(maxCost)}`);
		}

		console.log(`Price: ${valStr(price)}`);

	} catch(error) {
		throw error
		// What errors can we expect here? 
	}
}


sendSomeTx().catch(console.log);

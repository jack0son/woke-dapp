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

	const userId = `randomUser-${Math.floor(Math.random() * Math.floor(1000))}`;



	let gasPrice = new BN(txOpts.gasPrice);
	let gasLimit = new BN(txOpts.gas);
	console.log('gasPrice: ', gasPrice.toString());
	console.log('gasLimit: ', gasLimit.toString());

	maxTxCost = gasPrice.mul(gasLimit);
	console.log(`Max tx cost (wei): ${maxTxCost.toString()}`);
	console.log(`Max tx cost (eth): ${web3.utils.fromWei(maxTxCost, 'ether')}`);

	console.log(maxTxCost.toString())

	console.log('\n\n');
	let send = poor;
	const balance = web3.utils.fromWei((await web3.eth.getBalance(send)), 'ether')
	console.log(`Poor's balance: ${balance}`);
	console.log(`Max tx cost (wei): ${maxTxCost}`);
	console.log(`Max tx cost (eth): ${web3.utils.fromWei(maxTxCost, 'ether')}`);

	let opts = {...txOpts, from: send, to: owner, value: 1};
	let estimate = await web3.eth.estimateGas(opts);
	console.log('Estimate gas used: ', estimate);
	console.log('est is bigNumber: ', web3.utils.isBN(estimate)); // FALSE

	//console.log(opts);
	let r = await web3.eth.sendTransaction(opts)
	console.log('Gas used: ', r.gasUsed);
	const txCost = gasPrice.mul(new BN(r.gasUsed));
	console.log(`Tx cost (wei): ${txCost.toString()}`);
	console.log(`Tx cost (wei): ${web3.utils.fromWei(txCost, 'ether')}`);
	console.log('Handle revert? ', web3.eth.handleRevert);
	// console.log(r);
	//
	await safeGas(woken, 'claimUser', [userId], txOpts);

	//r = await woken.methods.claimUser(userId).send(txOpts);
	//console.log(r);

}

const valStr = wei => `eth:${toEth(wei)} wei:${wei.toString()}`;

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
		const medianPrice = await web3.eth.getGasPrice();
		console.log(`Median price: ${valStr(medianPrice)}`);

		console.log(contract.methods[method]);
		let estimate = await contract.methods[method](...args).estimateGas({ from: txOpts.from });
		console.log(`Estimated gas: ${estimate}`);
		let cost = gasPrice.mul(new BN(estimate));
		console.log(`Estimated tx cost ${valStr(cost)}`);

		let balance = await web3.eth.getBalance(txOpts.from);

		let price;
		if(cost > balance) {
			console.log('Error: cannot affort tx at median gas cost');
		} else if(cost*2 < balance) {
			price = medianPrice * 2;
			console.log('Using double median cost');
		}

	} catch(error) {
		throw error
		// What errors can we expect here? 
	}
}


sendSomeTx().catch(console.log);

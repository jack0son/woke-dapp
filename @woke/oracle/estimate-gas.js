const { web3Tools } = require('@woke/lib');

//const web3Utils = require('web3-utils');
//const DEFAULT_WEI = web3Utils.toWei('0.04', 'ether');

const artifacts = require('@woke/contracts');
const wokeTokenInterface = artifacts[process.env.NODE_ENV !== 'development' ? 'production' : 'development'].WokeToken;

const { web3, account, network } = web3Tools.init.instantiate();
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

	//console.log(web3.utils.fromWei((await web3.eth.getBalance('0x9eAD27E55f916c7fCD754477d8BABCAC180573dD')), 'ether'));

	const userId = `randomUser-${Math.floor(Math.random() * Math.floor(1000))}`;
	await web3Tools.utils.safePriceEstimate(web3)(woken, 'claimUser', [userId], txOpts);

	//await accountBalances();
	//r = await woken.methods.claimUser(userId).send(txOpts);
	//console.log(r);
}

const valStr = (wei, delim = ', ') => `${toEth(wei)} ETH${delim}${wei.toString()} wei`;

sendSomeTx().catch(console.log);

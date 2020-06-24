const { persist, persistenceConfig, networkList } = require('./config');
const { web3Tools} = require('@woke/lib');
const FunderSystem = require('./funder-system');

const bootstrap = async () => {

	const { network, web3 } = await web3Tools.init.instantiate('development');
	const accounts = await web3.eth.getAccounts();
	const [defaultAccount, owner, oraclize_cb, claimer, stranger_a, stranger_b, unclaimed, ...rest] = accounts;

	const funderSystem = new FunderSystem(undefined, {
		persist: false,
		retryInterval: 5*1000,
		//networkList,
	});

	funderSystem.start();

	const users = [
		{ id: '12345', address: stranger_a },
		{ id: '12346', address: stranger_b },
		{ id: '12347', address: unclaimed },
	];
	//const newUser = { id: '12345', address: stranger_a };

	
	await Promise.all(users.map(user => funderSystem.fundAccount(user.address, user.id)));
}

bootstrap().catch(console.log);

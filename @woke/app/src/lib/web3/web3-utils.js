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
		console.log('Subscriber', `Subscribed to ${contract.options.address}`);
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

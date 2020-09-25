import { Contract, SendOptions } from 'web3-eth-contract';
import utils, { AbiItem } from 'web3-utils';
import { Artifact } from './truffle';
import Environment from '../environment';
import Instance from './instance';

export { Artifact, Contract as Web3Contract };

type Address = string;

// interface web3Api {
// 	instance:
// }

export const initContract = (instance: Instance) => async (
	artifact: Artifact,
	environment?: Environment
) => {
	const web3 = await instance.get();
	const contract: Contract = environment
		? new web3.eth.Contract(
				artifact.abi,
				artifact.networks[environment.networkId].address
		  )
		: new web3.eth.Contract(artifact.abi);
	return contract;
};

export const deployContract = (contract: Contract) => (
	artifact: Artifact,
	arguments: any[],
	opts: SendOptions
) =>
	contract
		.deploy({
			data: artifact.bytecode,
			arguments: [address],
		})
		.send(opts);

//export Artifact from './truffle';

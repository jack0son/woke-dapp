import NetworkId from './environment';
import { Web3Contract, Artifact, initContract } from './web3/contract';
import Environment from './environment';
import Instance from './web3/instance';

export interface ContractConfig {
	name: string;
	artifact: Artifact;
}

export class Contract {
	public contract: Web3Contract;
	constructor(instance: Instance, config: ContractConfig, environment: Environment) {
		this.contract = initContract(instance)(config.artifact, environment);
	}

	instance() {
		if (!this.isDeployed()) {
		}
	}

	isDeployed(): boolean {
		return true;
	}

	deploy() {}

	address(networkId: NetworkId) {
		return;
	}
}

// export class Contract extends Web3Contract {
// 	constructor(config: ContractConfig) {
// 		super(config);
// 	}
// }

export default (instance: Instance) => (
	config: ContractConfig,
	environment: Environment
) => new Contract(instance, config, environment);

//export const getContractInstance = (web3, artifact, networkId) => {
//	if (!artifact.networks[networkId]) {
//		console.dir(artifact);
//		console.dir(networkId);
//	}
//	if (!artifact.networks[networkId].address) {
//		console.dir(artifact);
//		console.dir(networkId);
//		//throw new Error(`Contract not deployed on network ID ${networkId}`);
//	}
//	const contract = new web3.eth.Contract(
//		artifact.abi,
//		artifact.networks[networkId].address
//		//{data: artifact.bytecode}
//	);
//	contract.options.address = artifact.networks[networkId].address;

//	return contract;
//};
//

// Web3 environment
import { SendOptions } from 'web3-eth-contract';

export type NetworkId = number;

export interface Network {
	id: NetworkId;
}

export interface Environment {
	sendOptions: SendOptions;
	networkId: NetworkId;
	network?: Network;
}

export default Environment;

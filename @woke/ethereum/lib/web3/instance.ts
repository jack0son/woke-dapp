import Web3 from 'web3';
import { instantiate } from '@woke/lib/web3-tools/web3-init';
import { Network } from '../environment';

// Instance wrapper for synchronizing configuration
export class Instance {
	private web3: Web3;
	public network: Network;
	public rpcUrl: string;
	public account: string;

	constructor(public networkName, public opts) {}

	instantiate() {
		const { web3, network, account, rpcUrl } = instantiate(this.networkName, this.opts);
		this.web3 = web3;
		this.network = network;
		this.account = account;
		this.rpcUrl = rpcUrl;
	}

	async get() {
		// perform checks
		return this.web3;
	}
}

export default Instance;

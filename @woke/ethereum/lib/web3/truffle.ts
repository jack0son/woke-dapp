import utils, { AbiItem } from 'web3-utils';

export interface Artifact {
	abi: AbiItem[];
	bytecode: any;
	networks?: any;
}

class DomainError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class InterfaceError extends DomainError {
	constructor(error, key, value) {
		// and tx data?
		super(`Invalid value for '${key}' message parameter: ${value}`);
		this.param = key;
		this.value = value;
	}
}

class ProviderError extends DomainError {
	constructor(error, network) {
		// and tx data?
		super(`FATAL: Connection to provider '${network.id}:${network.name}' failed`);
		this.network = network;
	}
}

const txIdStr = (tx) => tx.method || 'from ' + tx.opts.from;

class ParamError extends DomainError {
	constructor(error, tx) {
		super(`Transaction '${txIdStr(tx)}' failed due to invalid parameters.`);
		this.web3Error = error;
		this.data = { tx };
	}
}

class NonceError extends DomainError {
	constructor(error, tx) {
		super(`Transaction '${txIdStr(tx)}' failed due to invalid nonce ${tx.opts.nonce}`);
		this.web3Error = error;
		this.nonce = tx.opts.nonce;
		this.data = { tx };
	}
}

class TransactionError extends DomainError {
	constructor(error, tx) {
		// and tx data?
		super(`Transaction '${tx.method}' failed.`);
		this.web3Error = error;
		this.data = { tx };
	}
}

class OnChainError extends DomainError {
	constructor(error, tx, receipt) {
		// and tx data?
		super(`Transactions ${receipt.transactionHash} failed on chain.`);
		this.web3Error = error;
		this.data = { receipt, tx };
	}
}

class RevertError extends DomainError {
	constructor(error, tx) {
		super(
			`Transaction reverted ${
				error.reason ? `'${error.reason}'` : ` with no reason provided`
			}`
		);
		this.web3Error = error;
		this.reason = error.reason;
		this.data = { tx };
	}
}

module.exports = {
	DomainError,
	InterfaceError,
	ProviderError,
	ParamError,
	TransactionError,
	NonceError,
	OnChainError,
	RevertError,
};

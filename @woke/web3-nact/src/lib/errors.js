class DomainError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class ProviderError extends DomainError {
	constructor(error, network) {
		// and tx data?
		super(`FATAL: Connection to provider '${network.id}:${network.name}' failed`);
		this.network = network;
	}
}

class ParamError extends DomainError {
	constructor(error, tx) {
		// and tx data?
		super(`Transaction '${tx.method}' failed due to invalid parameters.`);
		this.web3Error = error;
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
	ProviderError,
	ParamError,
	TransactionError,
	OnChainError,
	RevertError,
};

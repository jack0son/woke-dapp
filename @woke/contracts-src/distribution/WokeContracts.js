const lndpfChunkedValues = require('./lnpdf-values.js');
const lnpdfIntegers = require('./lnpdf-int_values.json');
const BN = require('bn.js');
const Uint256 = require('./uint256');

const FOLLOWER_FLOOR = 100;
const CONTRACT_ADDRESS = '0xCCCCCCCCCCCC';

const LNPDF = {
	maximum: () => Number('0x24ae7a7ae6'),

	lnpdfExact: (x) => lnpdfIntegers.length ? lnpdfIntegers[lnpdfIntegers.length - 1] : lnpdfIntegers[x],

	lnpdfChunked: () => {
	},
}

class User {
	constructor(_id, _followers) {
		this.id = _id;
		this.followers = _followers;
		this.tributors = [];
		this.balance = Uint256(new BN(0));
		this.unclaimed = Uint256(new BN(0));
		this.claimed = false;
	}

	claim() {
		if(this.claimed) {
			throw new Error('Cannot claim already claimed user');
		}
		const unclaimed = this.unclaimed;
		this.balance += unclaimed;
		this.unclaimed = 0;
		this.claimed = true;
		return unclaimed;
	}
}

class WokeContract {
	constructor({
		maxSupply,
		maxPrice,
		inflectionSupply,
		steepness,
		useLnpdfApproximation = false,
	}) {
		this.address = CONTRACT_ADDRESS;
		this.maxSupply = maxSupply;
		this.a = maxPrice/2;
		this.b = inflectionSupply;
		this.c = steepness;
		this.supply = 1;
		this.followerBalance = 0;
		this.noTributePool = 0;

		this.userCount = 0;
		this.users = {}; // id => user
		this.maxWeights = {};
		this.joinEvents = {}; // id => event

		LNPDF.lnpdf = useLnpdfApproximation ? LNPDF.lnpdfChunked : LNPDF.lnpdfExact;
	}

	claimUser(_id, _followers) {
		// _fulfillClaim()
		this.users[_id] = new User(_id, _followers);
		const user = this.users[_id];
		const minted = this._curvedMint(_id, user.followers);
		const tributeBonusPool = this._calcTributeBonus(_id, minted);
		let deducted = 0;

		if(user.followers > 0){
			if(user.tributors.length == 0) {
				// If the user's followers is less than aggregate followers, claim the pool
				if(user.followers <= this.followerBalance - user.followers + FOLLOWER_FLOOR && this.noTributePool > 0) {
					const credit = _calcAllocation(LNPDF.lnpdf(user.followers), LNPDF.maximum(), this.noTributePool);
					this._transfer(this.address, user.id, credit);
					this.noTributePool -= credit;
				}

				// If the user's followers is greater than aggregate followers, bonus goes to pool
				if(user.followers > this.followerBalance - user.followers + FOLLOWER_FLOOR) {
					this._transfer(user.id, this.address, tributeBonusPool);
					this.noTributePool += tributeBonusPool;
					deducted = tributeBonusPool;
				}
			} else {
				deducted = this._distributeTributeBonuses(_id, _tributeBonusPool);
			}
		}

		let preJoinAmount = user.claim();
		this.userCount += 1;

		let joinBonus = minted - deducted;

		logEvent('Claimed', { id: _id, amount: user.balance, minted, joinBonus }); 
	}

	_distributeTributeBonuses(_id, _pool) {
		return 0;
	}

	_getUser(_id) {
		let user = this.users[_id];
		if(!user) {
			user = new User(_id, 0);
			this.users[_id] = user;
		}
		return user;
	}

	_transfer(_fromId, _toId, _amount) {
		if(_amount < 0) {
			throw new Error(`Cannot transfer negative amount ${_amount}`);
		}
		let from = this._getUser(_fromId);
		let to = this._getUser(_toId);
		if(from.balance < _amount) {
			throw new Error(`User ${_fromId} does not have ${_amount} tokens. Balance: ${from.balance}`);
		}
		from.balance -= _amount;
		to.balance += _amount;
		logEvent('Transfer', {from: _fromId, to: _toId, amount: _amount });
	}

	_curvedMint(_id, _followers) {
		let amount = calculatePurchaseReturn(this)(this.supply, _followers, this.followerBalance);
		console.log(amount);
		return this._mint(_id, amount);
	}

	_mint(_recipientId, _amount) {
		const diff = this.maxSupply - this.supply;
		let amount = _amount < diff ? _amount : diff;
		this.supply += amount;
		const r = this._getUser(_recipientId);
		r.balance += amount;
		logEvent('Minted', {minted: amount, id: _recipientId, balance: r.balance});
		return amount;
	}

	_calcTributeBonus(id, minted) {
		const user = this.users[id];
		const userWeight = LNPDF.lnpdf(user.followers);
		let tributeWeight;
		if(user.tributors.length == 0) {
			tributeWeight = LNPDF.maximum();
		} else {
			tributeWeight = this.maxWeights[_id];
		}

		let allocation = calcAllocation(tributeWeight, userWeight + tributeWeight, minted);
		logEvent('TributeBonus', { bonus: allocation, minted, followers: user.followers });
		return allocation;
	}
}

const logEvent = (name, event) => {
	let items = [];
	Object.keys(event).forEach(k => {
		items.push(`${k}: ${event[k]}`);
	})
	console.log(`  ${name.padEnd(10)} | ${items.join(', ')}`);
}

function calcAllocation(weight, sum, pool) {
	const ratio = (weight << 4)/sum;
	console.log('Ratio: ', ratio);
	return (pool * ratio) >> 4;
	//return (pool * ((weight << 4)/sum)) >>  4;
}

function calculatePurchaseReturn(contract) { 
	return (currentSupply, followers) => {
		const scale = Math.pow(10,18);
		const a = contract.a;
		const b = contract.b;
		const c = contract.c;

		const precision = 127;
		let squareTerm = currentSupply < b ? b - currentSupply : currentSupply - b;
		console.log('\nsquareTerm: ', squareTerm);
		let baseN = c + Math.pow(squareTerm, 2);
		console.log('baseN: ', baseN);
		//console.log('baseN-scaled: ', baseN);
		let rootTerm = Math.sqrt(baseN);
		const powerScale = Math.pow(2, precision);

		let power = rootTerm * powerScale;
		console.log('rootTerm: ', rootTerm);
		console.log('rootTerm-power: ', power);

		const F = followers;
		//let numerator = Math.pow(F,2) + (2*F*a*rootTerm);
		let numerator = (Math.pow(F,2) * powerScale) + (2*F*a*power);
		console.log('numerator: ', numerator);

		let denom = a * ( a*((currentSupply - b)*powerScale + power) + (F * powerScale))
		console.log('denom: ', denom);

		let result = Math.round(numerator/(denom * 2));
		console.log('purchase return: ', result);
		return result;
	}
}

module.exports = WokeContract;

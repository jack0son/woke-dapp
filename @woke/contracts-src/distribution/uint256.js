const BN = require('bn.js');

const max256bitValStr = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

function Uint(_bn, bits) {
	const maxInt = new BN('f'.repeat(int(bits/4)), 16);
	const bitLength = bits
	let bn = _bn;

	const overflow = (n) => {
		return n.umod(maxInt);
	}

	const operate = (op, ...args) => {
		let r = overflow(bn[op](...args));
		if(r.bitLength() > bitLength) {
			throw new Error(`Incorrect bitlength ${r.bitLength()} for Uint${bitLength}`);
		}
		return r;
	}

	const shiftl = (bits) => {
		// shift then bitMask to 256
		return (bn.ushln(bits))
	}

	const shiftr = () => {
		// shift then bitMask to 256
	}

	return {
		op: operate,
		bn,
	}
}

// Bignumber that overflows at 256 bits
function Uint256(_bn) {
	const maxVal = new BN(max256bitValStr, 16);
	let bn = _bn;
	const overflow = (n) => {
		return n.umod(maxVal);
	}

	const operate = (op, ...args) => {
		return overflow(bn[op](...args));
	}

	const shiftl = () => {
		// shift then bitMask to 256
	}

	const shiftr = () => {
		// shift then bitMask to 256
	}

	return {
		op: operate,
		bn,
	}
}

module.exports = Uint256;

let b = new BN(0, 16);
console.log(b.byteLength() * 8);
b = new BN(max256bitValStr, 16);

let mbn = Uint256(b);
let a = mbn.op('subn', 1);
console.log(a.bitLength());
a = mbn.op('add', b.addn(1));
console.log(a.bitLength());

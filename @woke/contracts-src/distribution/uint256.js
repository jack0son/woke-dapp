const BN = require('bn.js');

const max256bitValStr = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

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

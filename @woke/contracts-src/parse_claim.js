
const cs = '@getwoketoke 0xWOKE:932596541822419000,0x196b2baf7c56207fb177f4d2b19aa5893fd3256de7cc5f7edd458749f9bab3611e1263cba1fdecc79401fd5333ee33e21f893071253e7452b931e16961f09d0c01,1'

function parseClaim(cs) {
	console.log('len: ', cs.length);
	let prefixLen = cs.length - 67;
	console.log('prefixlen: ', prefixLen);

	let version = cs[cs.length - 1];
	let sig = new Array(65).fill(0);

	for(let i = cs.length - 3; i >= prefixLen; i--) {
		let j = (cs.length - 3) - i;
		console.log(`${i}, ${j}`);
		sig[j] = cs[i];
	}

	console.log(sig.toString());

	let sig2 = new Array(65).fill(0);
	for(let i = 0; i < 65; i++) {
		let j = cs.length - 3 - i;
		console.log(`${i}, ${j}`);
		sig2[i] = cs[j];
	}
	console.log(sig.toString());
}

parseClaim(cs);

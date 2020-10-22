// Replace library placeholders with library contract addresses
function linkBytecode(truffleArtifact, networkId) {
	const links = truffleArtifact.networks[networkId].links;
	const inBytecode = truffleArtifact.bytecode;
	let outBytecode = inBytecode.slice(0);

	// 40 character placeholders - addresses without 0x prefix
	//		__Helpers_______________________________
	//		__Distribution__________________________

	Object.keys(links).forEach((library) => {
		const address = links[library].slice(2);
		const regex = new RegExp(`__${library}_+`, 'g');
		outBytecode = outBytecode.replace(regex, address);
	});

	if (outBytecode.length !== inBytecode.length)
		throw new Error('Linked bytecode has incorrect length');

	if (outBytecode.includes('__')) throw new Error('Not all libraries were linked');

	return outBytecode;
}

module.exports = linkBytecode;

// const exampleArtifact = require('../../contracts-src/build/contracts/artifacts/UserRegistry.json');
// const r = linkBytecode(exampleArtifact, 12);
//console.log(r);

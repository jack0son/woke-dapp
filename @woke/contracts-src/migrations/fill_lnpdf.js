const lndpfValues = require('../distribution/lnpdf-values.js');

const lndPdfInitializer = (owner, instance) => {
	async function fillLnpdfChunk(batchSize, chunkSize, values) {
		console.log(`Filling yArray${chunkSize} with ${values.length} values...`);
		let filled = 0;
		for(let i = 0; i < values.length; i+=batchSize) {
			const arg = values.slice(i, i+batchSize);
			filled += arg.length;
			//console.log(`\t${i} to ${i+batchSize}, ${arg.length} values `);
			let r = await instance.fillArrayValues(chunkSize, arg, { from: owner });
		}
		console.log(`... filled ${filled} values`)
		if(filled != values.length) {
			console.warn(`WARN: expected to fill ${value.length} values, only filled ${filled}`);
		}
	}

	async function fillLnpdfArrays( batchSize = 64) {
		for(let i = 2; i <= 7; i++) {
			let chunkSize = Math.pow(2, i);
			await fillLnpdfChunk(batchSize, chunkSize, lndpfValues[chunkSize], { from: owner });
		}

		await instance.fillingComplete({ from: owner });
	}

	return fillLnpdfArrays;
}

module.exports = lndPdfInitializer;

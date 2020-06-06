const alpha = {
	maxSupply: 4e6,
	maxTributors: 256,
	curveParams: {
		maxPrice: 210,						// a/2
		inflectionSupply: 2.72e6, // b
		steepness: 1.4e9,					// c
	}
}

module.exports = {
	alpha,
	test: alpha,
}

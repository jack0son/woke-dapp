const Collection = require('./collection');
const j0 = require('@woke/jack0son');

const lists = {
	dummy: [
		{ id: '123345', handle: 'wokenet1', followers_count: 5 },
		{ id: '123346', handle: 'wokenet2', followers_count: 3 },
		{ id: '1233462312213', handle: 'wokenet3', followers_count: 132132412 },
	],
	real: ['list of real twitter users'],
	test: [],
};

const collections = j0.reduceToIndex(
	lists,
	(idx, name) => (idx[name] = Collection(lists[name]))
);

//const addresses = ['1232145122412', '1r54312341332', '12341242141212', '21341223113'];

// Export user collections
module.exports = collections;

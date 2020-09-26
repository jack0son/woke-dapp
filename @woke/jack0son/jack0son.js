const buildListIndex = (list, keyProp = 'id') =>
	list.reduce((idx, item) => {
		idx[item[keyProp]], item;
		return idx;
	}, Object.create(null));

const generateIndex = (list, fn) =>
	list.reduce((acc, item) => {
		fn(acc, item);
		return acc;
	}, Object.create(null));

// Take each entry in a list and map its value to the result of a function
// applied to its value
const memoIndex = (list, fn) =>
	list.reduce((acc, item) => {
		acc[item] = fn(item);
		return acc;
	}, Object.create(null));

const remapValues = (obj, fn) => memoIndex(Object.keys(obj), fn);

const rebuildMap = (map, list, keyProp) => {
	list.forEach((item) => {
		map.set(item[keyProp], item);
	});
	return map;
};

// Reduce each item then map the result to the item
const buildReducedMap = (map, list, reducer) => {
	list.forEach((item) => {
		map.set(reducer(item), item);
	});
	return map;
};
const ReducedMap = (list, reducer) => buildReducedMap(new Map(), list, reducer);

const buildMap = (list, keyProp) => rebuildMap(new Map(), list, keyProp);

/**
 * Create an index from an object using a generator function to mutate the index
 * contents
 *
 * @function reduceToIndex
 * @param {Object} obj - Object to reduce
 * @param {(acc, key) => ()} fn - Generator function
 * @return {Index} Index object
 */
const reduceToIndex = (obj, fn) => generateIndex(Object.keys(obj), fn);

// const reduceToIndex = (obj, fn) =>
// 	Object.keys(obj).reduce((acc, key) => {
// 		fn(acc, key);
// 		return acc;
// 	}, Object.create(null));

// Useful for primitive types that return truthey / falsey values
const exists = (obj) => obj !== undefined && obj !== null;

const isList = (list) => list && exists(list.length);
const isEmptyList = (list) => isList(list) && list.length === 0;
const notEmpty = (list) => exists(list) && !!list.length;

module.exports = {
	buildListIndex,
	generateIndex,
	remapValues,
	rebuildMap,
	buildReducedMap,
	ReducedMap,
	buildMap,
	reduceToIndex,
	exists,
	isList,
	isEmptyList,
	notEmpty,
};

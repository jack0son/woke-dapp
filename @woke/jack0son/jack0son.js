// a cotains b
const l = console.log;
const contains = (a, b) => {
	// fast for large N
	const A = new Set(a);
	return b.every((e) => A.has(e));
};

const sameElements = (a, b) => contains(a, b) && contains(b, a);

// Elements of array_b not in set_A
const setMinusArr = (A, b) =>
	b.reduce((arr, e) => {
		if (!A.has(e)) arr.push(e);
		return arr;
	}, []);

const arrMinusSet = (a, B) =>
	a.reduce((arr, e) => {
		if (!A.has()) arr.push(e);
		return arr;
	}, []);

const BminusA = (a, b) => setMinusArr(new Set(a), b);

const symmetricDiff = (a, b) => {
	return BminusA(b, a).concat(BminusA(a, b));
};

const propsRemovedGen = () => [];

const propsAddedGen = (obj_a) => {
	let _a = obj_a;
	let a = Object.keys(_a);
	const A = new Set(a); // could keep set in memory for continuous diff

	return () => {
		const b = Object.keys(_a);
		// items in new list not in old list
		let diff = setMinusArr(A, b);
		if (diff.length > 0) {
			diff.forEach((e) => A.add(e));
		}
		return diff;
	};
};

const propsDiffGen = (_a) => {
	let obj_a = _a;
	let a = Object.keys(obj_a);
	return (obj_b) => {
		const b = Object.keys(obj_b || obj_a);
		return symmetricDiff(a, b);
	};
};

const buildListIndex = (list, keyProp = 'id') =>
	list.reduce((idx, item) => {
		idx[item[keyProp]] = item;
		return idx;
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

const generateIndex = (list, fn) =>
	list.reduce((acc, item) => {
		fn(acc, item);
		return acc;
	}, Object.create(null));

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
const deleteEmptyKeys = (obj) =>
	Object.keys(obj).forEach((k) => {
		!exists(obj[k]) && delete obj[k];
	});

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
	symmetricDiff,
	sameElements,
	contains,
	propsDiffGen,
	propsAddedGen,
	deleteEmptyKeys,
};

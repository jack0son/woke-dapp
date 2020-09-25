function API(accounts, contractInstances, config) {
	function deployContracts() {}

	function claimUsers() {}

	function assign() {}

	function claimUser(user) {}

	function transfer(from, to) {}
}
const buildIndex = (list, map, keyProp = 'id') =>
	list.reduce((map, item) => {
		map.set(item[keyProp], item);
		return map;
	}, map);

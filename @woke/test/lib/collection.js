const configure = require('@woke/lib/configure');
const j0 = require('@woke/jack0son');

let i = 0;
class UserCollection {
	constructor(userList, opts) {
		if (!Array.isArray(userList)) throw new Error('User list must be an Array');
		const conf = configure(opts, { keyProp: 'id' });
		this.label = conf.label || `user_collecky-${(++i).toString().padStart(3, 0)}`;
		this.keyProp = conf.keyProp;

		this.userList = userList;
		this.build();
	}

	list() {
		return [...this.userList];
	}

	build() {
		this.map = j0.buildMap(this.userList, this.keyProp);
	}

	buildAddressMap() {
		this.addressMap = j0.buildMap(this.userList, 'address');
	}

	log() {
		return console.log(`${this.label}:`, ...arguments);
	}

	get(key) {
		return this.map.get(key);
	}

	byAddress(address) {
		return this.addressMap.get(address);
	}

	assignAddresses(addressList) {
		const diff = this.userList.length - addressList.length;
		if (diff > 0) this.log(`${diff} users will not get addresses`);
		let address;
		for (i in this.userList) {
			address = addressList[i];
			if (!address) break;
			this.userList[i].address = address;
		}
		this.buildAddressMap();
	}

	validate() {
		return (
			this.userList.filter((user) => user != this.map[user[this.keyProp]]).length == 0
		);
	}
}

//module.exports = UserCollection;
module.exports = (list, label) => new UserCollection(list, { label });

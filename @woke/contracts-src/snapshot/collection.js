const configure = require('@woke/lib/configure');
const j0 = require('./jack0son');

let i = 0;
class UserCollection {
	constructor(userList, opts) {
		if (!userList || userList.length === undefined)
			throw new Error('Must provide user list');
		const conf = configure(opts, { keyProp: 'id' });
		this.name = conf.name || `user_collecky-${++i.toString().padStart(3, 0)}`;
		this.keyProp = conf.keyProp;

		this.list = userList;
		this.build();
	}

	build() {
		this.map = j0.buildMap(this.list, this.keyProp);
	}

	buildAddressMap() {
		this.addressMap = j0.buildMap(this.list, 'address');
	}

	log() {
		return console.log(`${this.name}:`, ...arguments);
	}

	get(key) {
		return this.map.get(key);
	}

	byAddress(address) {
		return this.addressMap.get(address);
	}

	assignAddresses(addressList) {
		const diff = this.list.length - addressList.length;
		if (diff > 0) this.log(`${diff} users will not get addresses`);
		let address;
		for (i in this.list) {
			address = addressList[i];
			if (!address) break;
			this.list[i].address = address;
		}
		this.buildAddressMap();
	}

	validate() {
		return this.list.filter((user) => user != this.map[user[this.keyProp]]).length == 0;
	}
}

//module.exports = UserCollection;
module.exports = (list, name) => new UserCollection(list, { name });

const configure = require('@woke/lib/configure');
const j0 = require('@woke/jack0son');

let i = 0;
class UserCollection {
	constructor(userList, opts) {
		if (!Array.isArray(userList)) throw new Error('User list must be an Array');
		const conf = configure(opts, { keyProp: 'id' });
		this.label = conf.label || `user_collecky-${(++i).toString().padStart(3, 0)}`;
		this.keyProp = conf.keyProp;

		// Disgusting...
		this.userList = userList.filter((u) => {
			if (!j0.exists(u.id)) return false;
			// If integers arguments to string parameters will be parsed by smart contract methods as an empty string
			if (typeof u.id !== 'string') u.id = u.id.toString();
			return true;
		});

		this.build();
	}

	list() {
		return [...this.userList];
	}

	build() {
		this.map = j0.buildListIndex(this.userList, this.keyProp);
	}

	buildAddressMap() {
		this.addressMap = j0.buildMap(this.userList, 'address');
	}

	log() {
		return console.log(`${this.label}:`, ...arguments);
	}

	get(key) {
		//return this.map.get(key);
		return this.map[key];
	}

	getMap() {
		return { ...this.map };
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
		return this.userList.every((user) => user === this.map[user[this.keyProp]]);
	}
}

//module.exports = UserCollection;
module.exports = (list, label) => new UserCollection(list, { label });

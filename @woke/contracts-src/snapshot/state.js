const buildAccountMap = (accountList, map, keyProp = 'id') =>
	accountList.reduce((map, account) => {
		map[account['keyProp']] = account;
		return map;
	}, map);

const defaultOpts = { keyProp: 'id' };
let i = 0;
class UserCollection {
	construct(userList, _opts) {
		const opts = { ...defaultOpts, ..._opts };
		this.name = opts.name || `user_collecky-${++i.toString().padStart(3,0)}`;
		this.list = userList;
		this.keyProp = keyProp;
		this.build();
	}

	build() {
		this.map = buildAccountMap(this.userList, this.map, this.keyProp);
	}

	log() {
		return console.log(`${this.name}:`, ...arguments)
	}

	get(key) {
		return map[key];
	}

	assignAddresses(addressList) {
		const diff = this.list.length - addressList.length);
		if(diff > 0) 
			console.log(`${diff} users will not get addresses`);
	}

	validate() {
		return this.list.filter(user => user != this.map[user[this.keyProp]]).length == 0;
	}

}

const testUserList = [{ id: 123345, handle: 'wokenet1' }];
const dummyUserList = [];

const testUsers = new UserCollection(testUserList, 'live-users')
const dummyUsers = new UserCollection(dummyUserList, 'dummy-users')

module.exports = { testUsers, dummyUsers };

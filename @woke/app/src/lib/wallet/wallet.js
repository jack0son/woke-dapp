import Hedgehog from '@audius/hedgehog'
//import Firebase from './firebase.js'
import ServerAPI from './api.js'

const AUTH_TABLE = "Authentications";
const USER_TABLE = "Users";

// turn this into an abstract component with state.
// feed wallet state from main container into others.

class Wallet {
	constructor(source = 'server') {
		if(source == 'firebase') {
			throw new Error('No firebase config present.')
			//this.firebase = new Firebase();
			//this.api = {
			//	setAuthFn: async obj => this.firebase.createIfNotExists(AUTH_TABLE, obj.lookupKey, obj),
			//	setUserFn: async obj => this.firebase.createIfNotExists(USER_TABLE, obj.username, obj),
			//	getFn: async obj => this.firebase.readRecordFromFirebase(AUTH_TABLE, obj),
			//}
		} else {
			this.api = ServerAPI;
		}

		this.hedgehog = new Hedgehog.Hedgehog(this.api.getFn, this.api.setAuthFn, this.api.setUserFn);
	}

	login(username, password) {
		return this.hedgehog.login(username, password);
	}

  checkStatus() {
		const wallet = this;
    if (wallet.hedgehog.isLoggedIn()) {
      return (true);
      // Retrieve wallet with: hedgehog.getWallet()
    } else {
      if (
        wallet.hedgehog &&
        wallet.hedgehog.walletExistsLocally &&
        wallet.hedgehog.walletExistsLocally()
      ) {
        return (true);
        // Retrieve wallet with: hedgehog.restoreLocalWallet()
      } else {
        return (false);
      }
    }
  }

	signUp(username, password) {
		return this.hedgehog.signUp(username, password);
	}

	logout() {
		return this.hedgehog.logout();
	}
}

export default Wallet;

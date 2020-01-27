import React, { 
	useRef, 
	useEffect, 
	useReducer, 
	useMemo, 
	useState
} from 'react'

import messages from '../constants/messages-login'


export default function useHedgehog(wallet) {
	//const wallet = props.wallet;
	const [savedUser, setSavedUser] = useState(retrieveUsername());
	const [userId, setUserId] = useState(retrieveUserId());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedIn, setSignedIn] = useState(wallet.checkStatus());

	const updateWalletStatus = () => {
		setSignedIn(wallet.checkStatus())
	}

  const handleSignup = async (_password, _confirmation) => {
		const pass = _password || password;
		const conf = _confirmation || passwordConfirmation;
		console.log(`Signup: ${username}`);
    if (pass !== conf) {
      setErrorMessage(messages.mismatched);

    } else if (!pass || !username || !conf) {
      setErrorMessage(messages.empty);

    } else {
      setLoading('signup');
      setErrorMessage("");

      try {
        await wallet.signUp(username, pass);
				storeUsername(username);
				saveUserId(userId);
				await handleLogin(pass);

      } catch (e) {
        console.error(e);
        setErrorMessage(messages.exists);
      }

      setLoading(false);
    }
  };

  const handleLogin = async _password => {
		const pass = _password || password;
    setErrorMessage("");
    setLoading('login');

    try {
			console.log(`Attempt login: ${username}`);
      await wallet.login(username, pass);
			saveUserId(userId);
      updateWalletStatus();

    } catch (e) {
      console.error(e);
      setErrorMessage(messages.invalid);
    }

    setLoading(false);
  };

	const restoreUsername = () => {
		setUsername(savedUser);
	}

  const logout = () => {
    wallet.logout();
    setUsername("");
    setPassword("");
    setPasswordConfirmation("");
    updateWalletStatus();
  };

	const saveUserId = (userId) => {
		setUserId(userId);
		storeUserId(userId);
	}

	return {
		getWallet: wallet.hedgehog.getWallet,

		api: {
			handleLogin,
			handleSignup,
			logout,
			setPassword: {
				password: setPassword,
				confirmation: setPasswordConfirmation
			},
			setUsername,
			restoreUsername 
		},

		state: {
			username,
			userId,
			savedUser,
			signedIn,
			loading,
			errorMessage
		}
	}
}

function storeUsername (username) {
	window.localStorage.setItem('hedgehog_username', username);
}

function retrieveUsername () {
	return window.localStorage.getItem('hedgehog_username')
}

function storeUserId (userId) {
	window.localStorage.setItem('hedgehog_userid', userId);
}

function retrieveUserId () {
	return window.localStorage.getItem('hedgehog_userid');
}

	/*

refer here https://github.com/AsureNetwork/asure-dapp/blob/master/packages/dapp/src/utils/asure-ws-wallet-provider.js
*/

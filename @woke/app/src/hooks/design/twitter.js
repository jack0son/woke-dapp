import React, {
	useContext,
	createContext,
	useState,
	useMemo,
} from 'react';

const Context = createContext();
export const useTwitterContext = () => useContext(Context);

export default function TwitterContextProvider({children}) {
	const [twitterSignedIn, setTwitterSignedIn] = useState(window.localStorage.getItem('design-twitter_auth') || false)
	const setSignedIn = (state) => {
		window.localStorage.setItem('design-twitter_auth', state)
		setTwitterSignedIn(state);
	};

	const userSignin = {
		signIn: () => {console.log('twitter: signed in'); setSignedIn(true)},
		isSignedIn: () => twitterSignedIn,
		haveUser: () => window.localStorage.getItem('design-twitter_auth') || false,
	};

	return (
		<Context.Provider
			value={useMemo(
				() => ({
					userSignin,
				}),
				[
					userSignin,
				]
			)}
		>
			{children}
		</Context.Provider>
	);
}
